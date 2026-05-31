# Delete User Button (Admin UI) — Design Spec

**Date:** 2026-05-30
**Area:** `facility-management-ui/` (Next.js 15 Pages Router + Redux-Saga)
**Status:** Approved for planning

## Goal

Add a **Delete** action to the admin users table that calls the backend
`DELETE /api/user/:id` (soft-delete, permission-gated by `users:delete`),
behind a confirmation modal. Because the UI has **no test framework today**,
this work also bootstraps a Jest + React Testing Library setup and covers the
delete flow with automated tests.

## Background / Current State

- Backend endpoint already shipped: `DELETE /api/user/:id`, gated by
  `users:delete`; soft-deletes, revokes sessions, and enforces guard rails
  (403 self-delete, 409 last super admin, 409 open assigned complaints, 404
  missing). Guard-rail failures return descriptive messages.
- Users table: `src/pages/admin/users/index.tsx`. Row actions are built in
  `getActions(row)` and rendered via an `ActionMenu`. Today:
  - **View** — always.
  - **Edit**, **Change Role** — gated by `canWriteUsers` (`users:write`).
  - **Activate/Deactivate** toggle — gated by `canDeleteUsers`
    (`users:delete`); this is a reversible status flip, distinct from delete.
- Redux user module: `src/constants/user.constant.ts`,
  `src/actions/user.action.ts`, `src/redux/reducers/user.reducer.ts`,
  `src/redux/sagas/user.saga.ts`, types in `src/types/user.d.ts`.
- API calls go through `authenticatedRequest(uri, { method })` in
  `src/utilities/saga-helpers.ts`; `handleSagaError(error, ERROR_TYPE)`
  extracts the API message and shows a **red snackbar** automatically.
- Existing single-id DELETE saga to mirror: `deleteMeeting` in
  `src/redux/sagas/meeting.saga.ts` (`${URI}/${id}`, `method: 'DELETE'`).
- Existing confirm modals to mirror: `UserStatusModal`
  (`src/components/Modals/UserStatus/index.tsx`) and `DeleteModal`
  (`src/components/Modals/Delete/index.tsx`).
- Permission gating: `usePermission().can(Permission.USERS_DELETE)`;
  `Permission.USERS_DELETE = 'users:delete'` already exists in
  `src/constants/permissions.enum.ts`. List re-fetch after a mutation is
  triggered by an `AppEmitter` `*_SUCCESS` listener in the users page.
- **No UI test runner exists.** `package.json` has no `test` script, no
  Testing Library, no jest config, and `src/` has zero spec files (the only
  `jest` mention is an ESLint `extends: "react-app/jest"`).

## Requirements

1. A **Delete** row action in the users table, gated by `users:delete`,
   styled destructive (red), placed after the Activate/Deactivate toggle.
2. A **DeleteUserModal** confirmation dialog (name + warning, Cancel + red
   Delete), mirroring `UserStatusModal`.
3. Redux wiring for a **single-id** delete (`DELETE /user/:id`): constant,
   action creator + type, saga + watcher + rootSaga registration, reducer
   loading toggle.
4. On success: success snackbar + users-list re-fetch (via `AppEmitter`).
5. On failure: backend guard-rail messages surface as red snackbars via the
   existing `handleSagaError` — **no special-casing**.
6. **Bootstrap a UI test framework** (Jest + RTL + jsdom via `next/jest`) and
   add tests for the reducer, saga (success + error), and modal.

### Out of scope (YAGNI)

- Bulk/multi-select delete (backend route is single-id).
- A restore/undelete UI.
- Changing or removing the existing Activate/Deactivate behavior.
- Refactoring unrelated parts of the users page or other modules.

## Architecture

### Part A — Test infrastructure (prerequisite for Part B tests)

- Use **`next/jest`** (the framework's supported transform; matches Next.js
  15) with the `jsdom` test environment.
- Add dev deps: `jest`, `jest-environment-jsdom`, `@testing-library/react`,
  `@testing-library/jest-dom`, `@testing-library/user-event`,
  `@types/jest`. (Use versions compatible with React 19 / Next 15 — RTL ≥ 16.)
- Files:
  - `jest.config.ts` — `next/jest` `createJestConfig`, `testEnvironment:
    'jsdom'`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`,
    `moduleNameMapper` for the `@/*` → `src/*` alias.
  - `jest.setup.ts` — `import '@testing-library/jest-dom'`.
  - `package.json` — `"test": "jest"`, `"test:watch": "jest --watch"`.
- A trivial smoke test proves the harness runs and the `@/` alias resolves.

### Part B — Delete user feature

**Redux (mirror `deactivate`, but single-id path param like `deleteMeeting`):**

- `user.constant.ts`: add `DELETE_USER`, `REQUEST_DELETE_USER`,
  `DELETE_USER_SUCCESS`, `DELETE_USER_ERROR`. (`USER_URI` already exists.)
- `src/types/user.d.ts`: `export interface DeleteUserForm { id: number }`.
- `user.action.ts`: `DeleteUserAction { type: typeof DELETE_USER; data:
  DeleteUserForm }`; creator `deleteUser = (data: DeleteUserForm) => ({ type:
  DELETE_USER, data })`; export from `userActions`.
- `user.saga.ts`:
  ```ts
  function* deleteUser({ data }: DeleteUserAction) {
    yield put({ type: userConstants.REQUEST_DELETE_USER });
    try {
      if (!data) return;
      const uri = `${userConstants.USER_URI}/${data.id}`;
      const jsonResponse = yield* authenticatedRequest(uri, { method: 'DELETE' });
      if (!jsonResponse) return;
      yield put({ type: userConstants.DELETE_USER_SUCCESS });
      AppEmitter.emit(userConstants.DELETE_USER_SUCCESS, jsonResponse);
      yield put(appActions.setSnackBar({
        type: 'success',
        message: (jsonResponse.message as string) ?? 'User deleted successfully',
        variant: 'success',
      }));
    } catch (error: unknown) {
      yield* handleSagaError(error, userConstants.DELETE_USER_ERROR);
    }
  }
  ```
  Add `deleteUserWatcher` (`takeLatest(DELETE_USER, deleteUser)`) and register
  it in the module's rootSaga `all([...])`.
- `user.reducer.ts`: extend the `IsRequestingUsers` toggle —
  `REQUEST_DELETE_USER` → true; `DELETE_USER_SUCCESS` / `DELETE_USER_ERROR` →
  false (same shape as deactivate). No deleted-user detail is stored.

**Component — `src/components/Modals/DeleteUser/index.tsx`** (mirror
`UserStatusModal`):
- Props: `userId: number`, `userName?: string`, `open: boolean`,
  `onClose?: () => void`, optional `className`/`children` trigger.
- Uses `FullscreenModal`. Title "Delete User"; body warns, naming the user:
  "Are you sure you want to delete **{userName}**? This removes their access
  and they will no longer appear in the user list."
- Buttons: Cancel (neutral) and Delete (`bg-red-600 hover:bg-red-700`).
- Confirm: `dispatch(userActions.deleteUser({ id: userId }))` then `onClose`.

**Users page — `src/pages/admin/users/index.tsx`:**
- In `getActions(row)`, inside the `canDeleteUsers` block, append a `Delete`
  item: `{ label: 'Delete', icon: DELETE_ICON, variant: 'danger', onClick: ()
  => handleDeleteUser(row) }`, after the Activate/Deactivate toggle.
- Add a `DELETE_ICON` (inline trash SVG, same style as the existing inline
  `EDIT_ICON`/`ROLE_ICON` SVGs).
- Add **dedicated** state for the delete flow — `showDeleteUserModal` +
  `deleteUserData` — set by `handleDeleteUser(row)`. Use a separate state slot
  (not the shared `editUserData`) so the delete modal can't collide with the
  edit / status-toggle flows.
- Render `<DeleteUserModal open={showDeleteUserModal} userId={...}
  userName={...} onClose={...}/>` (conditionally, mirroring how
  `UserStatusModal` is rendered).
- Add an `AppEmitter` listener for `DELETE_USER_SUCCESS` that re-fetches the
  users list, mirroring the existing deactivate-success listener (and clean it
  up on unmount).

### Styling

Destructive **red** (`bg-red-600` / `hover:bg-red-700`), consistent with the
existing Deactivate button and item `DeleteModal`. This does not conflict with
the white + gold brand (red is reserved for destructive actions, not a primary
brand surface).

## Data Flow

```
Row "Delete" (gated users:delete) → DeleteUserModal
  → confirm → dispatch deleteUser({ id })
  → saga: DELETE /api/user/:id
      → success: DELETE_USER_SUCCESS + AppEmitter → list re-fetch + green snackbar
      → error (403/404/409): handleSagaError → DELETE_USER_ERROR + red snackbar
        (shows backend message, e.g. "Cannot delete the last active super admin")
```

## Testing

Part A delivers the harness; Part B tests ride on it.

- **Reducer** (`user.reducer` test): `REQUEST_DELETE_USER` sets
  `IsRequestingUsers` true; `DELETE_USER_SUCCESS` and `DELETE_USER_ERROR` set
  it false. Unknown action returns state unchanged.
- **Saga** (`deleteUser` test — step the generator manually; no
  redux-saga-test-plan dependency is added):
  - Success path: dispatches `REQUEST_DELETE_USER`, calls
    `authenticatedRequest` with `${USER_URI}/${id}` + `{ method: 'DELETE' }`,
    dispatches `DELETE_USER_SUCCESS`, then a success snackbar.
  - Early return when `authenticatedRequest` yields `null` (401 handled):
    no `DELETE_USER_SUCCESS`.
  - Error path: a thrown error routes to `handleSagaError(error,
    DELETE_USER_ERROR)`.
- **Modal** (RTL): renders the user name; clicking **Delete** dispatches
  `deleteUser({ id })` (assert via a mocked store/dispatch) and calls
  `onClose`; clicking **Cancel** dispatches nothing and calls `onClose`.

Manual verification (run the app): delete a normal user → row disappears +
green toast; attempt to delete the last super admin → red toast with the
backend message.

## Files

**New**
- `jest.config.ts`, `jest.setup.ts`
- `src/components/Modals/DeleteUser/index.tsx`
- Tests: `src/redux/reducers/user.reducer.test.ts`,
  `src/redux/sagas/user.saga.test.ts`,
  `src/components/Modals/DeleteUser/index.test.tsx`, plus a smoke test.

**Modified**
- `package.json` (dev deps + `test` scripts)
- `src/constants/user.constant.ts`
- `src/types/user.d.ts`
- `src/actions/user.action.ts`
- `src/redux/sagas/user.saga.ts`
- `src/redux/reducers/user.reducer.ts`
- `src/pages/admin/users/index.tsx`
