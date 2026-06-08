import { test, expect, Page, BrowserContext, APIRequestContext, request } from '@playwright/test';

/* ────────────────────────────────────────────────────────────────────────
 * Inventory-reconciliation lifecycle E2E (real local full-stack).
 *
 * Drives the actual UI through the whole flow:
 *   counter: login -> new count (Department=Facility) -> enter counts ->
 *            save -> submit  -> (assert approve buttons hidden = SoD)
 *   approver: fresh context login -> open submitted session -> assert
 *             variances -> approve & post -> assert POSTED
 *   then asserts stock changed via an authenticated API GET.
 *
 * Logins drive the real form (the app stores the JWT in a cookie AND in
 * localForage/IndexedDB, which storageState does not capture) — so each
 * role gets its own browser context and logs in for real.
 * ──────────────────────────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:3800/api/v1/';
const PASSWORD = 'Syst3m5P@s5W0rd';
const COUNTER_EMAIL = 'largeempire2006@gmail.com';
const APPROVER_EMAIL = 'opeyemifemi@rocketmail.com';

const QUANTITY_ITEM = 'E2E Quantity Widget';
const SERIALIZED_ITEM = 'E2E Serialized Gadget';

/** Drive the real login form and wait for the post-login /admin landing. */
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Default-password users would land on /change-password; the seed flips
  // has_default_password=false so these two go straight to /admin/dashboard.
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });
}

/** Authenticated API client for a user (for the stock assertions). */
async function apiFor(email: string): Promise<{ ctx: APIRequestContext; token: string }> {
  const ctx = await request.newContext({ baseURL: API_BASE });
  const res = await ctx.post('authentication/login', {
    data: { email, password: PASSWORD },
  });
  expect(res.ok(), `login API for ${email}`).toBeTruthy();
  const body = await res.json();
  const token = body?.data?.accessToken as string;
  expect(token, `accessToken for ${email}`).toBeTruthy();
  return { ctx, token };
}

/** GET an item's actualQuantity by name via the item search/list API. */
async function itemActualQuantity(
  ctx: APIRequestContext,
  token: string,
  name: string,
): Promise<{ actualQuantity: number; goodUnits: number }> {
  // The Facility department is id 2 in the seed; pull its items and match by name.
  const res = await ctx.get('item/department/2?page=1&limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `item list status (${res.status()})`).toBeTruthy();
  const body = await res.json();
  const items: any[] =
    body?.data?.items ?? body?.data?.data ?? body?.data ?? [];
  const found = items.find((i) => i?.name === name);
  expect(found, `item "${name}" present in API response`).toBeTruthy();
  const units: any[] = found.itemUnits ?? [];
  const goodUnits = units.filter(
    (u) => u?.condition === 'Good' && (u?.status ?? 'A') !== 'I',
  ).length;
  return { actualQuantity: Number(found.actualQuantity), goodUnits };
}

test.describe.configure({ mode: 'serial' });

test('reconciliation lifecycle: counter counts & submits, approver approves & posts, stock changes', async ({
  browser,
}) => {
  // ── Baseline stock (sanity) ──
  const approverApi = await apiFor(APPROVER_EMAIL);
  const qtyBefore = await itemActualQuantity(approverApi.ctx, approverApi.token, QUANTITY_ITEM);
  const serBefore = await itemActualQuantity(approverApi.ctx, approverApi.token, SERIALIZED_ITEM);
  expect(qtyBefore.actualQuantity).toBe(100);
  expect(serBefore.goodUnits).toBe(2);

  /* ───────────────────────── COUNTER ───────────────────────── */
  const counterCtx: BrowserContext = await browser.newContext();
  const counter: Page = await counterCtx.newPage();
  await login(counter, COUNTER_EMAIL);

  // Go to reconciliation list and open a new count.
  await counter.goto('/admin/reconciliation');
  // The "New Count" label is on a <button> nested in a role="button" span;
  // target the real <button> element to avoid the strict-mode ambiguity.
  await counter.locator('button', { hasText: 'New Count' }).click();

  // Modal: scope defaults to Department; pick Facility in the dept combo.
  await expect(counter.getByText('Open Count Session')).toBeVisible();
  await counter.getByRole('button', { name: 'Select department' }).click();
  await counter.getByPlaceholder('Search...').fill('Facility');
  await counter.getByRole('listitem').filter({ hasText: /^Facility$/ }).click();
  await counter.getByRole('button', { name: 'Open Session' }).click();

  // Lands on the new session's count sheet.
  await counter.waitForURL(/\/admin\/reconciliation\/\d+$/, { timeout: 30_000 });
  const sessionUrl = counter.url();
  const sessionId = Number(sessionUrl.split('/').pop());
  expect(Number.isFinite(sessionId)).toBeTruthy();

  await expect(counter.getByText('Count Sheet')).toBeVisible();
  // The item name also appears inside the submit-blocked hint text, so match
  // the dedicated line-title div (carries a title="<item>" attribute).
  await expect(counter.locator(`div[title="${QUANTITY_ITEM}"]`)).toBeVisible();
  await expect(counter.locator(`div[title="${SERIALIZED_ITEM}"]`)).toBeVisible();

  // ── Quantity line: counted = 97, reason = Lost/Stolen ──
  const qtyInput = counter.getByLabel(`Counted quantity for ${QUANTITY_ITEM}`);
  await qtyInput.fill('97');
  // Reason select appears once variance != 0.
  const qtyReason = counter.getByLabel(`Variance reason for ${QUANTITY_ITEM}`);
  await expect(qtyReason).toBeVisible();
  await qtyReason.selectOption('LOST_STOLEN');

  // ── Serialized line: expand units, mark one Missing, reason Lost/Stolen ──
  await counter.getByRole('button', { name: /Units \(2\)/ }).click();
  // First unit's Present/Missing toggle: click "Missing".
  await counter.getByRole('button', { name: 'Missing' }).first().click();
  // The unit reason select appears for the now-missing unit.
  const unitReason = counter.getByLabel('Unit reason').first();
  await expect(unitReason).toBeVisible();
  await unitReason.selectOption('LOST_STOLEN');

  // ── Save, then submit for approval ──
  await counter.getByRole('button', { name: 'Save counts' }).click();
  await expect(counter.getByText('Save counts')).toBeVisible(); // re-enabled after save
  // Submit becomes enabled once every variance has a reason.
  const submitBtn = counter.getByRole('button', { name: 'Submit for approval' });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // State flips to SUBMITTED — the count-sheet edit actions disappear and
  // the "Pending Approval" panel appears.
  await expect(counter.getByText('Pending Approval')).toBeVisible({ timeout: 30_000 });

  // ── Segregation of duties: counter must NOT see approve/reject ──
  await expect(counter.getByRole('button', { name: 'Approve & post' })).toHaveCount(0);
  await expect(counter.getByRole('button', { name: 'Reject' })).toHaveCount(0);
  await expect(
    counter.getByText(/you cannot approve it \(segregation of duties\)/i),
  ).toBeVisible();

  await counterCtx.close();

  /* ───────────────────────── APPROVER ───────────────────────── */
  const approverCtx: BrowserContext = await browser.newContext();
  const approver: Page = await approverCtx.newPage();
  await login(approver, APPROVER_EMAIL);

  // Open the submitted session directly (the approver holds read-all so the
  // Facility session is in scope).
  await approver.goto(`/admin/reconciliation/${sessionId}`);
  await expect(approver.locator(`div[title="${QUANTITY_ITEM}"]`)).toBeVisible({ timeout: 30_000 });

  // Variances render: -3 on the quantity line, -1 on the serialized line.
  await expect(approver.getByText('-3').first()).toBeVisible();
  await expect(approver.getByText('-1').first()).toBeVisible();

  // Approver DOES see the approval actions.
  const approveBtn = approver.getByRole('button', { name: 'Approve & post' });
  await expect(approveBtn).toBeVisible();
  await approveBtn.click();

  // ── Assert POSTED ──
  await expect(approver.getByText('Posted.')).toBeVisible({ timeout: 30_000 });
  await expect(
    approver.getByText(/approved and applied to inventory/i),
  ).toBeVisible();

  await approverCtx.close();

  /* ──────────────────── STOCK CHANGED (API) ──────────────────── */
  const qtyAfter = await itemActualQuantity(approverApi.ctx, approverApi.token, QUANTITY_ITEM);
  const serAfter = await itemActualQuantity(approverApi.ctx, approverApi.token, SERIALIZED_ITEM);

  expect(qtyAfter.actualQuantity).toBe(97); // 100 - 3 lost
  expect(serAfter.goodUnits).toBe(1); // one unit marked missing

  await approverApi.ctx.dispose();
});
