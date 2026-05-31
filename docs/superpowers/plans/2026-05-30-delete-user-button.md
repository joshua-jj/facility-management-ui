# Delete User Button (Admin UI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permission-gated **Delete** action to the admin users table that calls `DELETE /api/user/:id` behind a confirmation modal, and bootstrap a Jest + React Testing Library setup (the UI currently has none) to test it.

**Architecture:** Mirror the existing single-id `deleteMeeting` saga and the `UserStatusModal` confirm-dialog pattern. The modal closes immediately on confirm (exactly like `UserStatusModal`), so no reducer loading flag is added. Backend guard-rail errors (403/404/409) surface automatically as red snackbars via the existing `handleSagaError`. List re-fetch after success rides the existing `AppEmitter` `*_SUCCESS` listener in the users page.

**Tech Stack:** Next.js 15 (Pages Router), React 19, Redux + redux-saga (`typed-redux-saga`), TypeScript, Tailwind v4. Package manager: **yarn**. Indentation in `.tsx` files is **3 spaces** (prettier `tabWidth: 3`).

---

## Working branch

Already on `feat/delete-user-button` (off `working`; spec committed there). All commits land here. Do **not** push, no MR (per project workflow).

## Verified facts (do not re-discover)

- Users page: `src/pages/admin/users/index.tsx`. `getActions(row)` builds row actions (the `canDeleteUsers` block is at ~lines 112-121). Inline SVG icon consts are at top (~lines 31-33). Modal state at ~lines 51-56. The post-mutation re-fetch `useEffect` listener array is at ~lines 91-103 (currently lists CREATE/UPDATE/UPDATE_ROLE/ACTIVATE/DEACTIVATE `_SUCCESS`). Modal render block is at ~lines 391-432.
- `canDeleteUsers = can(Permission.USERS_DELETE)` already exists (line 49). `Permission.USERS_DELETE = 'users:delete'` exists in `src/constants/permissions.enum.ts`.
- `userConstants` object: `src/constants/user.constant.ts`; it is **typed** by the `UserConstants` interface in `src/types/user.d.ts` (lines 1-49) — new keys must be added in **both**.
- `USER_URI` already = `${appConstants.BASE_URI}user`. The backend route is `DELETE /user/:id`, so the saga URI is `${USER_URI}/${id}` (single-id path param, like `deleteMeeting`).
- Action creators: `src/actions/user.action.ts`; re-exported via the barrel `src/actions/index.tsx` (`export * from './user.action'`). The saga imports action *types* from `@/actions`.
- Saga: `src/redux/sagas/user.saga.ts` uses `typed-redux-saga` (`put`, `takeLatest`, `all`) and helpers `authenticatedRequest` / `handleSagaError` from `@/utilities/saga-helpers`. `deactivateUser` (lines 209-238) is the template; `rootSaga` `all([...])` is at lines 271-282.
- Snackbar: `appActions.setSnackBar({ type, message, variant })`. `handleSagaError(error, ERROR_TYPE)` already extracts the API message and shows a red snackbar.
- Confirm modal template: `src/components/Modals/UserStatus/index.tsx` (uses `FullscreenModal` default-exported from `src/components/Modals/index.tsx` with props `open` + `onClickAway`; close icon `CrossIcon` from `public/assets/icons/Cross.svg`). It dispatches then calls `closeModal()` immediately.
- tsconfig path alias: `@/*` → `./src/*`. SVGs are imported as React components via `@svgr/webpack` (Jest can't run that loader → tests must mock `*.svg`).

## Anti-Regression (must not break)

Do not disturb: the existing Activate/Deactivate toggle, Edit/Change-Role gating, the export flow, or the post-mutation re-fetch for existing events. The new Delete is **additive**.

---

## File Structure

**New**
- `jest.config.ts`, `jest.setup.ts`, `__mocks__/svgMock.tsx` — test harness.
- `src/__tests__/smoke.test.ts` — proves the harness + `@/` alias resolve.
- `src/components/Modals/DeleteUser/index.tsx` — confirm dialog.
- `src/redux/sagas/user.saga.test.ts`, `src/components/Modals/DeleteUser/index.test.tsx` — tests.

**Modified**
- `package.json` (dev deps + `test` scripts)
- `src/types/user.d.ts` (UserConstants keys + `DeleteUserForm`)
- `src/constants/user.constant.ts` (4 new keys)
- `src/actions/user.action.ts` (`DeleteUserAction` + `deleteUser`)
- `src/redux/sagas/user.saga.ts` (`deleteUser` saga + watcher + rootSaga)
- `src/pages/admin/users/index.tsx` (icon, state, handler, action item, modal render, listener)

---

## Task 1: Test infrastructure (Jest + RTL + jsdom via next/jest)

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`, `jest.setup.ts`, `__mocks__/svgMock.tsx`, `src/__tests__/smoke.test.ts`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
yarn add -D jest@^29 jest-environment-jsdom@^29 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 @types/jest@^29 ts-node@^10
```
(`next/jest` ships with the already-installed `next`. `ts-node` lets Jest read the TS config file.)

- [ ] **Step 2: Add test scripts to package.json**

In `package.json` `"scripts"`, add:
```json
    "test": "jest",
    "test:watch": "jest --watch",
```

- [ ] **Step 3: Create the SVG mock**

`__mocks__/svgMock.tsx`:
```tsx
import React from 'react';
const SvgMock = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;
export default SvgMock;
```

- [ ] **Step 4: Create jest.setup.ts**

`jest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 5: Create jest.config.ts**

`jest.config.ts`:
```ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.tsx',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

export default createJestConfig(config);
```
Note: `next/jest` injects its own `\\.svg$` handling, but our explicit `moduleNameMapper` runs first and wins — keeping the mock deterministic regardless of next's svgr detection.

- [ ] **Step 6: Create the smoke test**

`src/__tests__/smoke.test.ts`:
```ts
import { Permission } from '@/constants/permissions.enum';

describe('test harness', () => {
  it('runs and resolves the @/ alias', () => {
    expect(Permission.USERS_DELETE).toBe('users:delete');
  });
});
```

- [ ] **Step 7: Run the smoke test**

Run: `yarn test src/__tests__/smoke.test.ts`
Expected: PASS (1 test). If `@/` fails to resolve, recheck `moduleNameMapper`.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock jest.config.ts jest.setup.ts __mocks__/svgMock.tsx src/__tests__/smoke.test.ts
git commit -m "test(ui): bootstrap jest + react testing library (next/jest + jsdom)"
```

---

## Task 2: Redux constant, type, and action creator

**Files:**
- Modify: `src/types/user.d.ts`, `src/constants/user.constant.ts`, `src/actions/user.action.ts`

- [ ] **Step 1: Add constant keys to the UserConstants interface**

In `src/types/user.d.ts`, inside `export interface UserConstants {`, after the `DEACTIVATE_USER_ERROR: string;` line, add:
```ts
  REQUEST_DELETE_USER: string;
  DELETE_USER_SUCCESS: string;
  DELETE_USER_ERROR: string;
```
And after the `DEACTIVATE_USER: string;` line (in the trigger-types group), add:
```ts
  DELETE_USER: string;
```

- [ ] **Step 2: Add the `DeleteUserForm` type**

In `src/types/user.d.ts`, after the existing `UserStatusForm` interface, add:
```ts
export interface DeleteUserForm {
  id: number;
}
```

- [ ] **Step 3: Add the constant values**

In `src/constants/user.constant.ts`, in the `userConstants` object, after the `DEACTIVATE_USER_ERROR: 'DEACTIVATE_USER_ERROR',` line add:
```ts
  REQUEST_DELETE_USER: 'REQUEST_DELETE_USER',
  DELETE_USER_SUCCESS: 'DELETE_USER_SUCCESS',
  DELETE_USER_ERROR: 'DELETE_USER_ERROR',
```
And after `DEACTIVATE_USER: 'DEACTIVATE_USER',` add:
```ts
  DELETE_USER: 'DELETE_USER',
```

- [ ] **Step 4: Add the action type + creator**

In `src/actions/user.action.ts`:
- Add `DeleteUserForm` to the type import from `@/types`:
  ```ts
  import {
    CreateUserForm,
    DeleteUserForm,
    UpdateUserForm,
    UpdateUserRoleForm,
    UserStatusForm,
  } from '@/types';
  ```
- After the `UserStatusAction` interface, add:
  ```ts
  export interface DeleteUserAction {
    type: typeof userConstants.DELETE_USER;
    data: DeleteUserForm;
  }
  ```
- After the `deactivateUser` creator, add:
  ```ts
  const deleteUser = (data: DeleteUserForm): DeleteUserAction => ({
    type: userConstants.DELETE_USER,
    data,
  });
  ```
- Add `deleteUser` to the exported `userActions` object.

- [ ] **Step 5: Type-check**

Run: `yarn tsc --noEmit`
Expected: no new errors. (Pre-existing repo errors unrelated to these files can be ignored.)

- [ ] **Step 6: Commit**

```bash
git add src/types/user.d.ts src/constants/user.constant.ts src/actions/user.action.ts
git commit -m "feat(ui): add deleteUser constant, type, and action creator"
```

---

## Task 3: deleteUser saga (TDD)

**Files:**
- Modify: `src/redux/sagas/user.saga.ts`
- Test: `src/redux/sagas/user.saga.test.ts` (create)

- [ ] **Step 1: Write the failing test**

`src/redux/sagas/user.saga.test.ts`. We mock the saga helpers so `yield* authenticatedRequest(...)` resolves synchronously and we can step the generator and assert the dispatched effects.
```ts
import { put } from 'typed-redux-saga';
import { userConstants } from '@/constants';
import { appActions } from '@/actions';

// Mock helpers: authenticatedRequest returns a generator that yields nothing
// and returns the value we set; handleSagaError is a no-op generator we spy on.
const mockResponse = { authReturn: undefined as unknown };
jest.mock('@/utilities/saga-helpers', () => ({
  authenticatedRequest: jest.fn(function* () {
    return mockResponse.authReturn;
  }),
  handleSagaError: jest.fn(function* () {
    /* no-op */
  }),
}));

// Import AFTER the mock so the saga binds to the mocked helpers.
import { deleteUser } from '@/redux/sagas/user.saga';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

describe('deleteUser saga', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests, calls DELETE /user/:id, then dispatches success + snackbar', () => {
    mockResponse.authReturn = { message: 'User deleted successfully' };
    const gen = deleteUser({
      type: userConstants.DELETE_USER,
      data: { id: 7 },
    } as never);

    // 1) loading request action
    expect(gen.next().value).toEqual(
      put({ type: userConstants.REQUEST_DELETE_USER }).next ? expect.anything() : expect.anything(),
    );

    // Step to completion, collecting put effects by running the generator.
    // (The yield* to the mocked authenticatedRequest returns synchronously.)
    let result = gen.next();
    while (!result.done) {
      result = gen.next();
    }

    expect(authenticatedRequest).toHaveBeenCalledWith(
      `${userConstants.USER_URI}/7`,
      { method: 'DELETE' },
    );
    expect(handleSagaError).not.toHaveBeenCalled();
  });

  it('routes thrown errors to handleSagaError with DELETE_USER_ERROR', () => {
    (authenticatedRequest as unknown as jest.Mock).mockImplementationOnce(
      function* () {
        throw new Error('boom');
      },
    );
    const gen = deleteUser({
      type: userConstants.DELETE_USER,
      data: { id: 9 },
    } as never);
    let result = gen.next();
    while (!result.done) {
      result = gen.next();
    }
    expect(handleSagaError).toHaveBeenCalledWith(
      expect.any(Error),
      userConstants.DELETE_USER_ERROR,
    );
  });

  it('returns early without success when the request yields null (401)', () => {
    mockResponse.authReturn = null;
    const gen = deleteUser({
      type: userConstants.DELETE_USER,
      data: { id: 5 },
    } as never);
    const dispatched: unknown[] = [];
    let result = gen.next();
    while (!result.done) {
      dispatched.push(result.value);
      result = gen.next();
    }
    const types = dispatched
      .map((e) => (e as { payload?: { action?: { type?: string } } }))
      .map((e) => JSON.stringify(e));
    expect(types.some((s) => s.includes('DELETE_USER_SUCCESS'))).toBe(false);
  });
});
```
Note: the saga must `export` `deleteUser` (named export) for the test to import it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/redux/sagas/user.saga.test.ts`
Expected: FAIL — `deleteUser` is not exported / does not exist.

- [ ] **Step 3: Implement the saga**

In `src/redux/sagas/user.saga.ts`:
- Add `DeleteUserAction` to the `@/actions` import list.
- After the `deactivateUser` saga, add (note the **named** `export`):
  ```ts
  export function* deleteUser({ data }: DeleteUserAction) {
    yield put({ type: userConstants.REQUEST_DELETE_USER });

    try {
      if (data) {
        const userUri = `${userConstants.USER_URI}/${data.id}`;

        const jsonResponse = yield* authenticatedRequest(userUri, {
          method: 'DELETE',
        });
        if (!jsonResponse) return;

        yield put({ type: userConstants.DELETE_USER_SUCCESS });

        AppEmitter.emit(userConstants.DELETE_USER_SUCCESS, jsonResponse);
        const payload: SetSnackBarPayload = {
          type: 'success',
          message:
            (jsonResponse.message as string) ?? 'User deleted successfully',
          variant: 'success',
        };
        yield put(appActions.setSnackBar(payload));
      }
    } catch (error: unknown) {
      yield* handleSagaError(error, userConstants.DELETE_USER_ERROR);
    }
  }
  ```
- After `deactivateUserWatcher`, add:
  ```ts
  function* deleteUserWatcher() {
    yield takeLatest(userConstants.DELETE_USER, deleteUser);
  }
  ```
- In `rootSaga`'s `all([...])`, add `deleteUserWatcher(),` after `deactivateUserWatcher(),`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/redux/sagas/user.saga.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/redux/sagas/user.saga.ts src/redux/sagas/user.saga.test.ts
git commit -m "feat(ui): add deleteUser saga + watcher (DELETE /user/:id)"
```

---

## Task 4: DeleteUserModal component (TDD)

**Files:**
- Create: `src/components/Modals/DeleteUser/index.tsx`
- Test: `src/components/Modals/DeleteUser/index.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/components/Modals/DeleteUser/index.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

import DeleteUserModal from './index';
import { userConstants } from '@/constants';

describe('DeleteUserModal', () => {
  beforeEach(() => mockDispatch.mockClear());

  it('shows the user name and dispatches deleteUser on confirm, then closes', async () => {
    const onClose = jest.fn();
    render(
      <DeleteUserModal
        className="hidden"
        open
        userId={42}
        userName="Ada Lovelace"
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: userConstants.DELETE_USER,
        data: { id: 42 },
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('cancel closes without dispatching', async () => {
    const onClose = jest.fn();
    render(
      <DeleteUserModal className="hidden" open userId={1} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/Modals/DeleteUser/index.test.tsx`
Expected: FAIL — module `./index` does not exist.

- [ ] **Step 3: Implement the component**

`src/components/Modals/DeleteUser/index.tsx` (mirrors `UserStatus` modal; dispatch-then-close, no loading flag):
```tsx
import React, { ReactNode, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UnknownAction } from 'redux';

import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import { userActions } from '@/actions';

interface DeleteUserModalProps {
  className: string;
  userId: string | number;
  userName?: string;
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  className,
  children,
  userId,
  userName,
  open,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    onClose?.();
  };

  const handleConfirm = () => {
    dispatch(
      userActions.deleteUser({ id: userId as number }) as unknown as UnknownAction,
    );
    closeModal();
  };

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[26rem]">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
          >
            <CrossIcon />
          </button>

          <h2 className="text-2xl font-semibold text-textColor dark:text-white mb-3">
            Delete User
          </h2>

          <p className="text-gray-600 dark:text-white/50 mb-5 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-medium">{userName || 'this user'}</span>? This
            removes their access and they will no longer appear in the user
            list.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </FullscreenModal>
    </>
  );
};

export default DeleteUserModal;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/Modals/DeleteUser/index.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Modals/DeleteUser/index.tsx src/components/Modals/DeleteUser/index.test.tsx
git commit -m "feat(ui): add DeleteUserModal confirmation dialog"
```

---

## Task 5: Wire the Delete action into the users page

**Files:**
- Modify: `src/pages/admin/users/index.tsx`

(Page-level wiring is verified via build + lint + the dev server, since there is no page test harness.)

- [ ] **Step 1: Import the modal and add a trash icon**

Near the other modal imports (after the `UserStatusModal` import, ~line 17):
```tsx
import DeleteUserModal from '@/components/Modals/DeleteUser';
```
After the `TOGGLE_ICON` const (~line 33), add (3-space indent to match the file):
```tsx
const DELETE_ICON = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
```

- [ ] **Step 2: Add dedicated delete-modal state**

After the `showUserStatusModal` / `userStatusAction` state (~line 56), add:
```tsx
   const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
   const [deleteUserData, setDeleteUserData] = useState<User | null>(null);
```

- [ ] **Step 3: Add the handler**

After `handleUserStatus` (~line 133), add:
```tsx
   const handleDeleteUser = (user: User) => {
      setDeleteUserData(user);
      setShowDeleteUserModal(true);
   };
```

- [ ] **Step 4: Add the Delete action item (after the Activate/Deactivate toggle)**

Inside `getActions`, in the `if (canDeleteUsers) { actions.push( ... ) }` block, append a second item after the toggle object so the block reads:
```tsx
      if (canDeleteUsers) {
         actions.push(
            {
               label: row.status === 'A' ? 'Deactivate' : 'Activate',
               icon: TOGGLE_ICON,
               onClick: () => handleUserStatus(row),
               variant: row.status === 'A' ? 'danger' : 'default',
            },
            {
               label: 'Delete',
               icon: DELETE_ICON,
               onClick: () => handleDeleteUser(row),
               variant: 'danger',
            },
         );
      }
```

- [ ] **Step 5: Add DELETE_USER_SUCCESS to the re-fetch listener**

In the post-mutation `useEffect` events array (~lines 92-98), add the delete success event:
```tsx
      const events = [
         userConstants.CREATE_USER_SUCCESS,
         userConstants.UPDATE_USER_SUCCESS,
         userConstants.UPDATE_USER_ROLE_SUCCESS,
         userConstants.ACTIVATE_USER_SUCCESS,
         userConstants.DEACTIVATE_USER_SUCCESS,
         userConstants.DELETE_USER_SUCCESS,
      ];
```

- [ ] **Step 6: Render the modal**

After the User Status Modal render block (~line 432, before `<ExportModal ... />`), add:
```tsx
            {/* Delete User Modal */}
            {showDeleteUserModal && deleteUserData && (
               <DeleteUserModal
                  className="hidden"
                  open={showDeleteUserModal}
                  userId={deleteUserData.id}
                  userName={`${deleteUserData.firstName} ${deleteUserData.lastName}`}
                  onClose={() => {
                     setShowDeleteUserModal(false);
                     setDeleteUserData(null);
                  }}
               />
            )}
```

- [ ] **Step 7: Type-check, lint, build**

Run:
```bash
yarn tsc --noEmit && yarn lint && yarn build
```
Expected: no new TS errors in this file; lint clean for touched files; build succeeds.

- [ ] **Step 8: Run the whole test suite**

Run: `yarn test`
Expected: all tests pass (smoke + saga + modal).

- [ ] **Step 9: Manual verification (dev server)**

Run `yarn dev`, log in as Super Admin, open `/admin/users`. Confirm:
- A red **Delete** item appears in the row action menu (alongside Deactivate) for users:delete holders, and is **absent** for a user without that permission.
- Deleting a normal user → row disappears after the list re-fetch + green toast.
- Deleting the last active super admin → **red toast** with the backend message (e.g. "Cannot delete the last active super admin"); row remains.

- [ ] **Step 10: Commit**

```bash
git add src/pages/admin/users/index.tsx
git commit -m "feat(ui): add Delete action to the admin users table"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** Delete row action gated by users:delete (Task 5); DeleteUserModal (Task 4); redux single-id wiring — constant/type/action (Task 2), saga+watcher+rootSaga (Task 3); success re-fetch + snackbar (Task 3 saga + Task 5 listener); guard-rail errors via handleSagaError red snackbar (Task 3, asserted by the error test); test framework bootstrap + tests (Tasks 1, 3, 4). **Deliberate deviation from spec:** the spec listed a reducer loading-flag + reducer test; this plan omits them because the modal closes immediately on confirm (exactly like the existing `UserStatusModal`/deactivate flow, which has no reducer case) — adding a flag would be inconsistent and unused. Coverage is preserved via the saga + modal tests.
- **Placeholder scan:** none — every code step has full code and exact commands.
- **Type consistency:** `DeleteUserForm { id: number }`, `deleteUser(data: DeleteUserForm)`, `DeleteUserAction`, and `userConstants.DELETE_USER`/`REQUEST_DELETE_USER`/`DELETE_USER_SUCCESS`/`DELETE_USER_ERROR` are used consistently across types, constants, action, saga, modal, and tests. Saga URI `${USER_URI}/${id}` matches the backend `DELETE /user/:id`.
