#!/usr/bin/env bash
#
# Local full-stack harness for the inventory-reconciliation E2E.
#
# Stands up an ISOLATED stack — it never touches the shared staging DB:
#   1. a throwaway Postgres 16 container (port 55432)
#   2. the NestJS API booted against it (port 3800, migrations run on boot)
#   3. seeds roles/permissions/users (npm run db:seed)
#   4. makes the two test users log straight in (has_default_password=false)
#   5. grants the counter the Facility MEMBER role (-> reconciliation:count)
#      via the real admin API as super-admin
#   6. seeds reconciliation DATA in the FACILITY department via the item API:
#      a QUANTITY item (actualQuantity 100) and a SERIALIZED item (2 GOOD units)
#
# The UI itself is started by Playwright's `webServer` (see playwright.config.ts),
# pointed at this API via NEXT_PUBLIC_BASE_URL=http://localhost:3800/api/v1/.
#
# Usage:
#   e2e/stack.sh up      # start PG + API + seed (idempotent-ish; up implies a fresh DB)
#   e2e/stack.sh down    # tear everything down
#
set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────
UI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$(cd "$UI_DIR/../facility-management-api" && pwd)"
RUN_DIR="${EGFM_E2E_RUN_DIR:-/tmp/egfm-e2e}"
mkdir -p "$RUN_DIR"

# ── Config ───────────────────────────────────────────────────────────────
PG_CONTAINER="egfm-e2e-pg"
PG_PORT=55432
PG_IMAGE="postgres:16-alpine"
DB_NAME="egfm_e2e"
DB_USER="postgres"
DB_PASS="postgres"

API_PORT=3800
API_BASE="http://localhost:${API_PORT}/api/v1"
API_LOG="$RUN_DIR/api.log"
API_PID_FILE="$RUN_DIR/api.pid"

TEST_PASSWORD='Syst3m5P@s5W0rd'
COUNTER_EMAIL='largeempire2006@gmail.com'
APPROVER_EMAIL='opeyemifemi@rocketmail.com'
SA_EMAIL='support@egfm.com'
FACILITY_DEPARTMENT_ID=2   # 'Facility' — second seeded department

# Env the API + seeder run with (overrides .env via process.env, which
# dotenv does NOT override). NODE_ENV=development turns SSL off for the
# local (non-cloud-host) Postgres.
api_env() {
  PG_HOST=localhost \
  PG_PORT="$PG_PORT" \
  PG_USERNAME="$DB_USER" \
  PG_PASSWORD="$DB_PASS" \
  PG_DATABASE="$DB_NAME" \
  NODE_ENV=development \
  PORT="$API_PORT" \
  "$@"
}

psql_exec() {
  docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

login_token() {
  # $1 = email -> prints accessToken (empty on failure)
  local email="$1"
  curl -s -X POST "${API_BASE}/authentication/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${TEST_PASSWORD}\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d).data.accessToken||'')}catch(e){process.stdout.write('')}})"
}

# ── Postgres ─────────────────────────────────────────────────────────────
start_pg() {
  echo "[stack] starting Postgres ($PG_CONTAINER) on :$PG_PORT ..."
  docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true
  docker run -d --rm --name "$PG_CONTAINER" \
    -e POSTGRES_PASSWORD="$DB_PASS" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "${PG_PORT}:5432" "$PG_IMAGE" >/dev/null

  for i in $(seq 1 60); do
    if docker exec "$PG_CONTAINER" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
      echo "[stack] Postgres ready (${i}s)"
      return 0
    fi
    sleep 1
  done
  echo "[stack] ERROR: Postgres did not become ready" >&2
  return 1
}

# ── API ──────────────────────────────────────────────────────────────────
start_api() {
  echo "[stack] booting API on :$API_PORT (migrations run on boot) ..."
  # Use the JS entry directly (the shell wrapper in .bin is not node-runnable).
  ( cd "$API_DIR" && api_env nohup node ./node_modules/@nestjs/cli/bin/nest.js start \
      > "$API_LOG" 2>&1 & echo $! > "$API_PID_FILE" )

  for i in $(seq 1 120); do
    # department/all is a Public route — a 200 means the app is serving.
    if curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/department/all" 2>/dev/null | grep -q 200; then
      echo "[stack] API serving (${i}s)"
      return 0
    fi
    if ! kill -0 "$(cat "$API_PID_FILE" 2>/dev/null)" 2>/dev/null; then
      echo "[stack] ERROR: API process exited early. Tail of log:" >&2
      tail -40 "$API_LOG" >&2
      return 1
    fi
    sleep 1
  done
  echo "[stack] ERROR: API did not start in time. Tail of log:" >&2
  tail -40 "$API_LOG" >&2
  return 1
}

# ── Seed ─────────────────────────────────────────────────────────────────
seed_db() {
  echo "[stack] seeding roles/permissions/users (db:seed) ..."
  ( cd "$API_DIR" && api_env npm run db:seed ) 2>&1 | tail -6

  echo "[stack] flipping has_default_password=false + verified for test users ..."
  psql_exec -c "UPDATE \"user\" SET has_default_password=false, is_verified=true \
    WHERE email IN ('${COUNTER_EMAIL}','${APPROVER_EMAIL}','${SA_EMAIL}');" >/dev/null
}

seed_reconciliation_data() {
  echo "[stack] granting Facility MEMBER role to the counter (admin API) ..."
  local sa_token counter_id
  sa_token="$(login_token "$SA_EMAIL")"
  if [ -z "$sa_token" ]; then echo "[stack] ERROR: SA login failed" >&2; return 1; fi
  counter_id="$(psql_exec -t -c "select id from \"user\" where email='${COUNTER_EMAIL}';" | tr -d ' \n')"
  # ADMIN(1) + USER(2) + MEMBER(4) — MEMBER grants reconciliation:count and,
  # since the counter is in Facility, scopes them to that department.
  curl -s -X PATCH "${API_BASE}/user/${counter_id}/roles" \
    -H "Authorization: Bearer ${sa_token}" -H 'Content-Type: application/json' \
    -d '{"roleIds":[1,2,4]}' >/dev/null

  echo "[stack] seeding FACILITY items (quantity + serialized) via item API ..."
  # Items need items:write, which the ADMIN approver holds (SUPER ADMIN does not).
  local admin_token cat_id store_id
  admin_token="$(login_token "$APPROVER_EMAIL")"
  if [ -z "$admin_token" ]; then echo "[stack] ERROR: approver login failed" >&2; return 1; fi

  # Resolve the system 'Uncategorized' category + first store.
  cat_id="$(curl -s "${API_BASE}/category" -H "Authorization: Bearer ${admin_token}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d).data||[];process.stdout.write(String((a[0]||{}).id||1))})")"
  store_id="$(curl -s "${API_BASE}/store?page=1&limit=10" -H "Authorization: Bearer ${admin_token}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const it=(JSON.parse(d).data||{}).items||[];process.stdout.write(String((it[it.length-1]||it[0]||{}).id||1))})")"

  curl -s -X POST "${API_BASE}/item/new" -H "Authorization: Bearer ${admin_token}" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"E2E Quantity Widget\",\"actualQuantity\":100,\"fragile\":false,\"departmentId\":${FACILITY_DEPARTMENT_ID},\"categoryId\":${cat_id},\"trackingMode\":\"Quantity\",\"storeId\":${store_id}}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('[stack]   quantity item:',j.message,'id='+(j.data&&j.data.id))})"

  curl -s -X POST "${API_BASE}/item/new" -H "Authorization: Bearer ${admin_token}" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"E2E Serialized Gadget\",\"actualQuantity\":2,\"fragile\":false,\"departmentId\":${FACILITY_DEPARTMENT_ID},\"categoryId\":${cat_id},\"trackingMode\":\"Serialized\",\"condition\":\"Good\",\"storeId\":${store_id}}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('[stack]   serialized item:',j.message,'id='+(j.data&&j.data.id),'units='+((j.data&&j.data.itemUnits||[]).length))})"
}

# ── Lifecycle ────────────────────────────────────────────────────────────
up() {
  start_pg
  start_api
  seed_db
  seed_reconciliation_data
  echo "[stack] UP. API base: ${API_BASE}/  (NEXT_PUBLIC_BASE_URL=${API_BASE}/)"
}

down() {
  echo "[stack] tearing down ..."
  if [ -f "$API_PID_FILE" ]; then
    kill "$(cat "$API_PID_FILE")" 2>/dev/null || true
    rm -f "$API_PID_FILE"
  fi
  # `nest start` (the CLI) forks the compiled app as a CHILD node process,
  # so killing the CLI parent alone leaves the server bound to the port.
  # Reap by name AND by whoever is actually listening on the API port.
  pkill -f "nest.js start" 2>/dev/null || true
  local listeners
  listeners="$(lsof -ti :"$API_PORT" 2>/dev/null || true)"
  if [ -n "$listeners" ]; then
    # shellcheck disable=SC2086
    kill -9 $listeners 2>/dev/null || true
  fi
  docker rm -f "$PG_CONTAINER" >/dev/null 2>&1 || true
  echo "[stack] DOWN."
}

case "${1:-up}" in
  up)   up ;;
  down) down ;;
  *)    echo "usage: $0 {up|down}" >&2; exit 2 ;;
esac
