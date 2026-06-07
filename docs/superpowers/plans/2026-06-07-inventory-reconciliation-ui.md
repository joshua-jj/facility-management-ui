# Inventory Reconciliation — UI Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Steps use `- [ ]` checkboxes.

**Goal:** Build the reconciliation UI (Redux-Saga module + count-sheet/approve pages + variance report + nav), wired to the live API, and prove the whole stack with a Playwright E2E.

**Architecture:** Standard domain module under `src/` (constants/types/actions/reducer/saga registered in the root reducer+saga), pages under `src/pages/admin/reconciliation/`, capability-gated via `usePermission`/`RoleGuard`/`PrivateRoute`. The reconciliation flow is a state machine — actions map to API verbs (open/saveCounts/submit/approve/reject/report), not CRUD.

**Tech Stack:** Next.js 15 (Pages Router), Redux-Saga, Formsy, Tailwind v4, Playwright (new).

## API contract (from the built backend — base `${NEXT_PUBLIC_BASE_URL}reconciliation`)
| UI action | Method + path | Body | Gate |
|---|---|---|---|
| open | `POST /reconciliation` | `{scopeType, departmentId?, categoryId?, note?}` | `reconciliation:count` |
| list | `GET /reconciliation?page&limit&state?` | — | `reconciliation:read` |
| detail | `GET /reconciliation/:id` | — | `reconciliation:read` |
| saveCounts | `PATCH /reconciliation/:id/count` | `{lines:[{lineId,countedOnHand?,reasonCode?,note?,units?:[{unitId?,itemUnitId?,serialNumber?,countedPresent?,isFound?,conditionObserved?,reasonCode?}]}]}` | `reconciliation:count` |
| submit | `POST /reconciliation/:id/submit` | — | `reconciliation:count` |
| approve | `POST /reconciliation/:id/approve` | — | `reconciliation:approve` |
| reject | `POST /reconciliation/:id/reject` | `{reason}` | `reconciliation:approve` |
| report | `GET /reconciliation/report` | — | `reconciliation:read` |

> Verify the actual route prefix/versioning during Task 4 by curling one endpoint against the running API (other UI modules hit `${BASE_URI}<name>` with no explicit version — mirror that, adjust if the controller is versioned).

States: `DRAFT|SUBMITTED|POSTED|REJECTED`. Reasons: `LOST_STOLEN|DAMAGED|FOUND_RECOVERED|MISCOUNT_DATA_ERROR`. Scope: `DEPARTMENT|CATEGORY`.

---

## Task 1: Permissions enum

**File:** Modify `src/constants/permissions.enum.ts`

- [ ] Add (matching the API wire strings exactly):
```ts
RECONCILIATION_READ = 'reconciliation:read',
RECONCILIATION_COUNT = 'reconciliation:count',
RECONCILIATION_APPROVE = 'reconciliation:approve',
```
- [ ] `yarn lint` clean. Commit: `feat(reconciliation): permission constants`.

---

## Task 2: Types + constants

**Files:** Create `src/types/reconciliation.d.ts`, `src/constants/reconciliation.constant.ts`; register the type export in `src/types/index.ts` and the constant in `src/constants/index.ts` (mirror how `item` is exported there).

- [ ] **Types** — `ReconciliationState`, `ReconciliationScopeType`, `ReconciliationReasonCode` string-literal unions; `ReconciliationUnit`, `ReconciliationLine`, `ReconciliationSession` (mirror API response DTOs incl. `reference, scopeType, departmentId, categoryId, state, lines, countedByUserId, approvedByUserId, submittedAt, approvedAt, rejectReason`); `ReconciliationStateShape` (redux slice: `allReconciliationsList, current, pagination, IsRequesting*`); `ReconciliationConstants` interface (all action-type strings + `RECONCILIATION_URI`).
- [ ] **Constants** — action types for: `GET_RECONCILIATIONS(/REQUEST/_SUCCESS/_ERROR)`, `OPEN_RECONCILIATION*`, `GET_RECONCILIATION_DETAIL*`, `SAVE_COUNTS*`, `SUBMIT_RECONCILIATION*`, `APPROVE_RECONCILIATION*`, `REJECT_RECONCILIATION*`, `GET_RECONCILIATION_REPORT*`; plus `RECONCILIATION_URI: ` + "`${appConstants.BASE_URI}reconciliation`".
- [ ] `yarn lint`/`tsc` clean. Commit: `feat(reconciliation): types + constants`.

---

## Task 3: Actions + reducer (+ register)

**Files:** Create `src/actions/reconciliation.action.ts`, `src/redux/reducers/reconciliation.reducer.ts`; modify `src/redux/reducers/index.ts`; export action in `src/actions/index.ts`.

- [ ] **Actions** — creators `getReconciliations(query)`, `openReconciliation(payload)`, `getReconciliationDetail(id)`, `saveCounts({id, lines})`, `submitReconciliation(id)`, `approveReconciliation(id)`, `rejectReconciliation({id, reason})`, `getReconciliationReport()` with typed action interfaces (mirror `item.action.ts`).
- [ ] **Reducer** — `combineReducers` slice with: `allReconciliationsList` (from `GET_*_SUCCESS`), `current` (from `GET_RECONCILIATION_DETAIL_SUCCESS` / cleared on open), `report`, `pagination`, and `IsRequesting*` booleans per async op. Register as `reconciliation: reconciliationRootReducer` in `redux/reducers/index.ts`.
- [ ] `tsc` clean. Commit: `feat(reconciliation): actions + reducer`.

---

## Task 4: Saga (+ register) — the API integration

**Files:** Create `src/redux/sagas/reconciliation.saga.ts`; modify `src/redux/sagas/index.ts`.

- [ ] Implement handlers using `authenticatedRequest(uri, config)` + `handleSagaError` (mirror `generator.saga.ts`). One per action; on success dispatch `*_SUCCESS` with `jsonResponse.data` (+ pagination for list); fire `appActions.setSnackBar` on the mutating ops; `AppEmitter.emit` the success constant so pages can react (e.g. close modal / refresh). Example (open):
```ts
function* openReconciliation({ data }: OpenReconciliationAction) {
  yield put({ type: reconciliationConstants.REQUEST_OPEN_RECONCILIATION });
  try {
    const uri = reconciliationConstants.RECONCILIATION_URI;
    const json = yield* authenticatedRequest(uri, { method: 'POST', body: JSON.stringify(data) });
    if (!json) return;
    yield put({ type: reconciliationConstants.OPEN_RECONCILIATION_SUCCESS, reconciliation: json?.data });
    AppEmitter.emit(reconciliationConstants.OPEN_RECONCILIATION_SUCCESS, json?.data);
    yield put(appActions.setSnackBar({ type: 'success', message: json?.message ?? 'Count session opened', variant: 'success' }));
  } catch (e) { yield* handleSagaError(e, reconciliationConstants.OPEN_RECONCILIATION_ERROR); }
}
```
Paths: list `?${params}`, detail `/${id}`, saveCounts `/${id}/count` (PATCH), submit `/${id}/submit` (POST), approve `/${id}/approve` (POST), reject `/${id}/reject` (POST), report `/report`. Register the watcher root saga in `redux/sagas/index.ts`.
- [ ] **Verify the route prefix now**: with the API running locally, `curl -s $NEXT_PUBLIC_BASE_URL'reconciliation' -H "Authorization: Bearer <token>"` (or check the API controller's `@Controller`/version) and adjust `RECONCILIATION_URI` if needed.
- [ ] Add a saga unit test `reconciliation.saga.test.ts` (mirror `user.saga.test.ts`): assert `openReconciliation` dispatches REQUEST then SUCCESS on a mocked `authenticatedRequest`. `yarn test` green.
- [ ] Commit: `feat(reconciliation): saga + API wiring`.

---

## Task 5: Nav entry

**File:** Modify `src/navigation/pageRoutes.tsx`

- [ ] Add a route after "generator logs": `{ id: <n>, label: 'reconciliation', link: '/admin/reconciliation', icon: <…>, permissions: [Permission.RECONCILIATION_READ] }` (reuse an existing icon, e.g. a clipboard/check icon already imported, or import one consistent with the set). Pure-capability gate (no `requiresFacilityTeam`).
- [ ] `yarn dev` → the entry shows for a user with `reconciliation:read`. Commit: `feat(reconciliation): sidebar nav entry`.

---

## Task 6: List page

**File:** Create `src/pages/admin/reconciliation/index.tsx`

- [ ] Table of sessions: `reference`, scope (dept/category name), `state` (colored badge per state), counter (`createdBy`), variance summary (count of non-zero lines), date. Filters: state dropdown. Pagination via the slice. "New count" button gated `RoleGuard permission={Permission.RECONCILIATION_COUNT}` → opens the New-session modal (Task 7). Row click → `/admin/reconciliation/[id]`. Dispatch `getReconciliations` on mount + filter change. Wrap export in `PrivateRoute permissions={[Permission.RECONCILIATION_READ]}` + `Layout` via `getLayout`. Brand: gold accents, white surfaces.
- [ ] `tsc`/`lint` clean; page renders against the running API. Commit: `feat(reconciliation): sessions list page`.

---

## Task 7: New-session modal

**File:** Create `src/components/Modals/OpenReconciliation/index.tsx`

- [ ] Formsy modal: `scopeType` select (Department|Category); conditionally a `departmentId` SelectInput (load departments from the existing department slice/action) OR a `categoryId` SelectInput (category slice); optional `note` TextArea. `onValidSubmit` → `dispatch(reconciliationActions.openReconciliation(payload))`. Subscribe to `AppEmitter` `OPEN_RECONCILIATION_SUCCESS` → close modal + `router.push('/admin/reconciliation/' + session.id)`.
- [ ] Commit: `feat(reconciliation): open-session modal`.

---

## Task 8: Count sheet page (DRAFT) — the core screen

**File:** Create `src/pages/admin/reconciliation/[id].tsx`

- [ ] Fetch detail (`getReconciliationDetail(id)`), read `current` from the slice. Header: reference, scope, state badge.
- [ ] **When state === DRAFT and `can(RECONCILIATION_COUNT)`** render the editable count sheet:
  - Each line row: item name, `expectedOnHand`, a numeric **counted** input, live **variance** (`counted − expected`, colored), and a **reason** `SelectInput` that appears only when variance ≠ 0 (options = the 4 reason codes). Optional note.
  - **Serialized lines** (line.trackingMode === 'Serialized') expand to a per-serial checklist: each unit row = serial, a present/missing toggle, a condition select, a reason select (shown when missing or condition≠Good); plus an "Add found unit" row (serial text + condition). Out-of-loan-only units come pre-listed; the line's counted = (#present + #found) is computed client-side and shown read-only.
  - Local form state holds the edits; **Save** → `dispatch(saveCounts({id, lines}))` (maps UI state to the PATCH body); **Submit for approval** → `dispatch(submitReconciliation(id))` (disabled until every line counted + reasons present for non-zero variances — mirror the API guard client-side for UX, but the API enforces it authoritatively).
- [ ] Read-only rendering for non-DRAFT states (show counted/variance/reason as text).
- [ ] `tsc`/`lint` clean; works against the API. Commit: `feat(reconciliation): count-sheet page (quantity + serialized per-unit)`.

---

## Task 9: Approve view + variance display

**File:** Modify `src/pages/admin/reconciliation/[id].tsx`

- [ ] **When state === SUBMITTED**: show the variance summary (per line: expected, counted, variance, reason; serialized: missing/found/damaged serials). If `can(RECONCILIATION_APPROVE)` **and** the viewer is not the counter (`current.countedByUserId !== currentUserId`), show **Approve** and **Reject** buttons (Reject opens a reason prompt). Approve → `dispatch(approveReconciliation(id))`; on success show the posting result (applied/skipped) snackbar + refresh. Reject → `dispatch(rejectReconciliation({id, reason}))`. Hide both for the counter (segregation, mirrored from the API).
- [ ] **When state === POSTED/REJECTED**: read-only outcome banner (posted by / at, or reject reason).
- [ ] Commit: `feat(reconciliation): approve/reject view with segregation`.

---

## Task 10: Variance report page

**File:** Create `src/pages/admin/reconciliation/report.tsx`

- [ ] Dispatch `getReconciliationReport`; render rollups: total variance by reason code (progress bars — comparison), sessions by state (counts). Novice-friendly viz per house style (progress bars for comparisons, sparkline if a trend is available); gold/white brand; every number from the API response (no hardcoded values). Gate `PrivateRoute permissions={[Permission.RECONCILIATION_READ]}`. Link to it from the list page header.
- [ ] Commit: `feat(reconciliation): variance report page`.

---

## Task 11: Playwright setup + local full-stack harness

**Files:** Create `playwright.config.ts`, `e2e/` dir, `e2e/global-setup.ts`, `e2e/fixtures/seed.ts`; add scripts to `package.json`; `.gitignore` for artifacts.

- [ ] `yarn add -D @playwright/test`; `npx playwright install chromium`.
- [ ] **Local stack** (do NOT use staging): a script/global-setup that (a) starts a local Postgres (reuse the API's testcontainers approach OR a `docker run postgres:16-alpine` on a fixed port), (b) runs the API pointed at it with migrations (`PG_*` env overrides → the local PG; the API's `migrationsRun:true` builds the schema on boot), (c) seeds via the API's seeder or direct SQL: a department with a quantity item + a serialized item (2 units), a **counter** user (holds `reconciliation:count`) and a distinct **approver** user (holds `reconciliation:approve`) with known passwords, (d) starts the UI (`yarn build && yarn start` or `yarn dev`) with `NEXT_PUBLIC_BASE_URL` → the local API. `playwright.config.ts` `webServer` can manage the UI; the API+DB are handled in global-setup. Tear everything down in global-teardown.
- [ ] `package.json`: `"e2e": "playwright test"`, `"e2e:headed": "playwright test --headed"`.
- [ ] Commit: `test(e2e): playwright + local full-stack harness`.

> If standing up the API+DB from Playwright global-setup proves brittle, fall back: document a `yarn e2e:stack` that the developer runs (docker-compose for PG + API + UI + seed) and have Playwright assume the stack is up at known URLs. Note whichever path is taken.

---

## Task 12: Playwright E2E — the full reconciliation flow

**File:** Create `e2e/reconciliation.spec.ts`

- [ ] Scenario (the proof):
  1. Log in through the UI as the **counter**; navigate to Reconciliation; click **New count**; pick the seeded department; open the session → lands on the count sheet.
  2. Enter a short count on the quantity item (e.g. expected 100 → counted 97, reason Lost/Stolen) and mark one serialized unit missing (reason Lost/Stolen); **Save**, then **Submit**.
  3. Assert the Approve/Reject buttons are **NOT** visible to the counter (segregation).
  4. Log out; log in as the **approver**; open the submitted session; assert variances + reasons render; click **Approve**.
  5. Assert the session shows **POSTED**, and verify the stock actually changed — either via the UI (item page shows reduced quantity) or by a direct API `GET` in the test (`request` fixture with the approver token) asserting the quantity item is now 97 and the serialized item's actual is 1.
- [ ] `yarn e2e` passes headless against the local stack. Commit: `test(e2e): reconciliation lifecycle through the UI`.

---

## Self-review notes (author)
- **Spec coverage:** API contract table → Tasks 1-4; nav → 5; list → 6; open → 7; count sheet (quantity + serialized per-unit) → 8; approve/segregation → 9; report → 10; E2E proof → 11-12.
- **Verify during execution:** the exact API route prefix/versioning (Task 4); the existing department/category slices to reuse for the modal selects; an existing icon to reuse for nav; how `currentUserId` is read for the segregation check (the user slice).
- **Out of scope:** editing a posted/rejected session; offline counting; barcode scanning (serial entry is manual text).
