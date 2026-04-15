import { put, takeLatest, all } from 'typed-redux-saga';
import { roleConstants } from '@/constants/role.constant';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';
import {
   GetRolesAction,
   GetRoleAction,
   CreateRoleAction,
   UpdateRoleAction,
   DeleteRoleAction,
   GetAvailablePermissionsAction,
   GetAssignedPermissionsAction,
   AddPermissionsToRoleAction,
   RemovePermissionsFromRoleAction,
} from '@/actions/role.action';

function* getRoles({ data }: GetRolesAction) {
   yield put({ type: roleConstants.REQUEST_GET_ROLES });

   try {
      let uri: string;
      let paginated = false;

      if (data?.limit !== undefined) {
         const page = data.page ?? 1;
         const limit = data.limit;
         uri = `${roleConstants.ROLE_URI}?page=${page}&limit=${limit}`;
         paginated = true;
      } else {
         uri = roleConstants.ROLE_ALL_URI;
      }

      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      const payload = jsonResponse?.data ?? jsonResponse;

      let items: unknown[];
      let meta: unknown = null;

      if (paginated) {
         items = Array.isArray(payload) ? payload : (payload as { items?: unknown[] })?.items ?? [];
         meta = (payload as { meta?: unknown })?.meta ?? null;
      } else {
         items = Array.isArray(payload) ? payload : [];
      }

      yield put({
         type: roleConstants.GET_ROLES_SUCCESS,
         roles: items,
         meta,
         append: data?.append ?? false,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.GET_ROLES_FAILURE, false);
   }
}

function* getRole({ id }: GetRoleAction) {
   yield put({ type: roleConstants.REQUEST_GET_ROLE });

   try {
      const uri = `${roleConstants.ROLE_URI}/${id}`;
      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      // API returns { statusCode, message: roleObject }
      const role = jsonResponse?.message ?? jsonResponse?.data ?? jsonResponse;

      yield put({
         type: roleConstants.GET_ROLE_SUCCESS,
         role,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.GET_ROLE_FAILURE, false);
   }
}

function* createRole({ data }: CreateRoleAction) {
   yield put({ type: roleConstants.REQUEST_CREATE_ROLE });

   try {
      if (data) {
         const uri = `${roleConstants.ROLE_URI}/new`;

         const jsonResponse = yield* authenticatedRequest(uri, {
            method: 'POST',
            body: JSON.stringify(data),
         });
         if (!jsonResponse) return;

         const created = jsonResponse?.data;

         yield put({
            type: roleConstants.CREATE_ROLE_SUCCESS,
            role: created,
         });

         yield put({ type: roleConstants.GET_ROLES });

         AppEmitter.emit(roleConstants.CREATE_ROLE_SUCCESS, jsonResponse);

         const payload: SetSnackBarPayload = {
            type: 'success',
            message: (jsonResponse?.message as string) ?? 'Role created successfully',
            variant: 'success',
         };
         yield put(appActions.setSnackBar(payload));
      }
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.CREATE_ROLE_FAILURE);
   }
}

function* updateRole({ data }: UpdateRoleAction) {
   yield put({ type: roleConstants.REQUEST_UPDATE_ROLE });

   try {
      if (data) {
         const { id, ...restData } = data;
         const uri = `${roleConstants.ROLE_URI}/${id}`;

         const jsonResponse = yield* authenticatedRequest(uri, {
            method: 'PATCH',
            body: JSON.stringify(restData),
         });
         if (!jsonResponse) return;

         yield put({
            type: roleConstants.UPDATE_ROLE_SUCCESS,
            role: jsonResponse?.data,
         });

         AppEmitter.emit(roleConstants.UPDATE_ROLE_SUCCESS, jsonResponse);

         const payload: SetSnackBarPayload = {
            type: 'success',
            message: (jsonResponse?.message as string) ?? 'Role updated successfully',
            variant: 'success',
         };
         yield put(appActions.setSnackBar(payload));
      }
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.UPDATE_ROLE_FAILURE);
   }
}

function* deleteRole({ id }: DeleteRoleAction) {
   yield put({ type: roleConstants.REQUEST_DELETE_ROLE });

   try {
      // Backend uses POST /role/deactivate with array body: [id]
      const uri = `${roleConstants.ROLE_URI}/deactivate`;

      const jsonResponse = yield* authenticatedRequest(uri, {
         method: 'POST',
         body: JSON.stringify([id]),
      });
      if (!jsonResponse) return;

      yield put({ type: roleConstants.DELETE_ROLE_SUCCESS });

      yield put({ type: roleConstants.GET_ROLES });

      AppEmitter.emit(roleConstants.DELETE_ROLE_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
         type: 'success',
         message: 'Role deactivated successfully',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.DELETE_ROLE_FAILURE);
   }
}

function* getAvailablePermissions({ roleId }: GetAvailablePermissionsAction) {
   yield put({ type: roleConstants.REQUEST_GET_AVAILABLE_PERMISSIONS });

   try {
      // Available permissions for a role come from /permissions/available?role_id=X
      const uri = `${process.env.NEXT_PUBLIC_BASE_URL}permissions/available?role_id=${roleId}&limit=100`;

      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      const payload = jsonResponse;
      const items = Array.isArray(payload)
         ? payload
         : (payload as { items?: unknown[] })?.items ?? [];

      yield put({
         type: roleConstants.GET_AVAILABLE_PERMISSIONS_SUCCESS,
         permissions: items,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.GET_AVAILABLE_PERMISSIONS_FAILURE, false);
   }
}

function* getAssignedPermissions({ roleId }: GetAssignedPermissionsAction) {
   yield put({ type: roleConstants.REQUEST_GET_ASSIGNED_PERMISSIONS });

   try {
      // Assigned permissions for a role come from /permissions/assigned?role_id=X
      const uri = `${process.env.NEXT_PUBLIC_BASE_URL}permissions/assigned?role_id=${roleId}&limit=100`;

      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      const payload = jsonResponse;
      const items = Array.isArray(payload)
         ? payload
         : (payload as { items?: unknown[] })?.items ?? [];

      yield put({
         type: roleConstants.GET_ASSIGNED_PERMISSIONS_SUCCESS,
         permissions: items,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.GET_ASSIGNED_PERMISSIONS_FAILURE, false);
   }
}

function* addPermissionsToRole({ data }: AddPermissionsToRoleAction) {
   yield put({ type: roleConstants.REQUEST_ADD_PERMISSIONS_TO_ROLE });

   try {
      const { roleId, permissionIds } = data;
      // POST /role/add-permission/:roleId body: { permissionIds: number[] }
      const uri = `${roleConstants.ROLE_URI}/add-permission/${roleId}`;

      const jsonResponse = yield* authenticatedRequest(uri, {
         method: 'POST',
         body: JSON.stringify({ permissionIds }),
      });
      if (!jsonResponse) return;

      yield put({ type: roleConstants.ADD_PERMISSIONS_TO_ROLE_SUCCESS });

      // Re-fetch both lists to refresh the TransferPane
      yield put({ type: roleConstants.GET_AVAILABLE_PERMISSIONS, roleId });
      yield put({ type: roleConstants.GET_ASSIGNED_PERMISSIONS, roleId });

      const payload: SetSnackBarPayload = {
         type: 'success',
         message: (jsonResponse?.message as string) ?? 'Permissions added successfully',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.ADD_PERMISSIONS_TO_ROLE_FAILURE);
   }
}

function* removePermissionsFromRole({ data }: RemovePermissionsFromRoleAction) {
   yield put({ type: roleConstants.REQUEST_REMOVE_PERMISSIONS_FROM_ROLE });

   try {
      const { roleId, permissionIds } = data;
      // POST /role/remove-permission body: { id: roleId, permissions: number[] }
      const uri = `${roleConstants.ROLE_URI}/remove-permission`;

      const jsonResponse = yield* authenticatedRequest(uri, {
         method: 'POST',
         body: JSON.stringify({ id: roleId, permissions: permissionIds }),
      });
      if (!jsonResponse) return;

      yield put({ type: roleConstants.REMOVE_PERMISSIONS_FROM_ROLE_SUCCESS });

      // Re-fetch both lists to refresh the TransferPane
      yield put({ type: roleConstants.GET_AVAILABLE_PERMISSIONS, roleId });
      yield put({ type: roleConstants.GET_ASSIGNED_PERMISSIONS, roleId });

      const payload: SetSnackBarPayload = {
         type: 'success',
         message: 'Permissions removed successfully',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(error, roleConstants.REMOVE_PERMISSIONS_FROM_ROLE_FAILURE);
   }
}

function* getRolesWatcher() {
   yield takeLatest(roleConstants.GET_ROLES, getRoles);
}

function* getRoleWatcher() {
   yield takeLatest(roleConstants.GET_ROLE, getRole);
}

function* createRoleWatcher() {
   yield takeLatest(roleConstants.CREATE_ROLE, createRole);
}

function* updateRoleWatcher() {
   yield takeLatest(roleConstants.UPDATE_ROLE, updateRole);
}

function* deleteRoleWatcher() {
   yield takeLatest(roleConstants.DELETE_ROLE, deleteRole);
}

function* getAvailablePermissionsWatcher() {
   yield takeLatest(roleConstants.GET_AVAILABLE_PERMISSIONS, getAvailablePermissions);
}

function* getAssignedPermissionsWatcher() {
   yield takeLatest(roleConstants.GET_ASSIGNED_PERMISSIONS, getAssignedPermissions);
}

function* addPermissionsToRoleWatcher() {
   yield takeLatest(roleConstants.ADD_PERMISSIONS_TO_ROLE, addPermissionsToRole);
}

function* removePermissionsFromRoleWatcher() {
   yield takeLatest(roleConstants.REMOVE_PERMISSIONS_FROM_ROLE, removePermissionsFromRole);
}

export default function* rootSaga() {
   yield all([
      getRolesWatcher(),
      getRoleWatcher(),
      createRoleWatcher(),
      updateRoleWatcher(),
      deleteRoleWatcher(),
      getAvailablePermissionsWatcher(),
      getAssignedPermissionsWatcher(),
      addPermissionsToRoleWatcher(),
      removePermissionsFromRoleWatcher(),
   ]);
}
