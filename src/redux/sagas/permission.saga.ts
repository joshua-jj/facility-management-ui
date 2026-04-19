import { put, takeLatest, all } from 'typed-redux-saga';
import { permissionConstants } from '@/constants/permission.constant';
import {
   CreatePermissionAction,
   UpdatePermissionAction,
   DeletePermissionAction,
} from '@/actions/permission.action';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';

interface GetPermissionsAction {
   type: string;
   data?: { page?: number; limit?: number; append?: boolean; search?: string; status?: string };
}

function* getPermissions({ data }: GetPermissionsAction) {
   yield put({ type: permissionConstants.REQUEST_GET_PERMISSIONS });

   try {
      let uri: string;
      let paginated = false;

      if (data?.limit !== undefined) {
         const page = data.page ?? 1;
         const limit = data.limit;
         const params = new URLSearchParams({ page: String(page), limit: String(limit) });
         if (data.search) params.set('search', data.search);
         if (data.status) params.set('status', data.status);
         uri = `${permissionConstants.PERMISSION_URI}?${params.toString()}`;
         paginated = true;
      } else {
         uri = permissionConstants.PERMISSION_ALL_URI;
      }

      const jsonResponse = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!jsonResponse) return;

      // Permission controller returns { items, meta, links } at the top level,
      // not wrapped in { message, data }. Fall back to .data for other shapes.
      const payload =
         (jsonResponse as { items?: unknown } | undefined)?.items !== undefined
            ? jsonResponse
            : (jsonResponse as { data?: unknown } | undefined)?.data;

      let items: unknown[];
      let meta: unknown = null;

      if (paginated) {
         items = Array.isArray(payload) ? payload : (payload as { items?: unknown[] })?.items ?? [];
         meta = (payload as { meta?: unknown })?.meta ?? null;
      } else {
         items = Array.isArray(payload)
            ? payload
            : (payload as { items?: unknown[] })?.items ?? [];
      }

      yield put({
         type: permissionConstants.GET_PERMISSIONS_SUCCESS,
         permissions: items,
         meta,
         append: data?.append ?? false,
      });
   } catch (error: unknown) {
      yield* handleSagaError(error, permissionConstants.GET_PERMISSIONS_FAILURE, false);
   }
}

function* createPermission({ data }: CreatePermissionAction) {
   yield put({ type: permissionConstants.REQUEST_CREATE_PERMISSION });

   try {
      if (data) {
         // Create endpoint uses /permissions/new suffix
         const uri = `${permissionConstants.PERMISSION_URI}/new`;

         const jsonResponse = yield* authenticatedRequest(uri, {
            method: 'POST',
            body: JSON.stringify(data),
         });
         if (!jsonResponse) return;

         yield put({
            type: permissionConstants.CREATE_PERMISSION_SUCCESS,
            permission: jsonResponse?.data,
         });

         AppEmitter.emit(permissionConstants.CREATE_PERMISSION_SUCCESS, jsonResponse);

         const payload: SetSnackBarPayload = {
            type: 'success',
            message: (jsonResponse?.message as string) ?? 'Permission created successfully',
            variant: 'success',
         };
         yield put(appActions.setSnackBar(payload));
      }
   } catch (error: unknown) {
      yield* handleSagaError(error, permissionConstants.CREATE_PERMISSION_FAILURE);
   }
}

function* updatePermission({ data }: UpdatePermissionAction) {
   yield put({ type: permissionConstants.REQUEST_UPDATE_PERMISSION });

   try {
      if (data) {
         const { id, ...restData } = data;
         const uri = `${permissionConstants.PERMISSION_URI}/${id}`;

         const jsonResponse = yield* authenticatedRequest(uri, {
            method: 'PATCH',
            body: JSON.stringify(restData),
         });
         if (!jsonResponse) return;

         yield put({
            type: permissionConstants.UPDATE_PERMISSION_SUCCESS,
            permission: jsonResponse?.data,
         });

         AppEmitter.emit(permissionConstants.UPDATE_PERMISSION_SUCCESS, jsonResponse);

         const payload: SetSnackBarPayload = {
            type: 'success',
            message: (jsonResponse?.message as string) ?? 'Permission updated successfully',
            variant: 'success',
         };
         yield put(appActions.setSnackBar(payload));
      }
   } catch (error: unknown) {
      yield* handleSagaError(error, permissionConstants.UPDATE_PERMISSION_FAILURE);
   }
}

function* deletePermission({ id }: DeletePermissionAction) {
   yield put({ type: permissionConstants.REQUEST_DELETE_PERMISSION });

   try {
      // Backend uses POST /permissions/deactivate with { id } body (not DELETE)
      const uri = `${permissionConstants.PERMISSION_URI}/deactivate`;

      const jsonResponse = yield* authenticatedRequest(uri, {
         method: 'POST',
         body: JSON.stringify({ id }),
      });
      if (!jsonResponse) return;

      yield put({ type: permissionConstants.DELETE_PERMISSION_SUCCESS });

      AppEmitter.emit(permissionConstants.DELETE_PERMISSION_SUCCESS, jsonResponse);

      const payload: SetSnackBarPayload = {
         type: 'success',
         message: (jsonResponse?.message as string) ?? 'Permission deactivated successfully',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(error, permissionConstants.DELETE_PERMISSION_FAILURE);
   }
}

function* getPermissionsWatcher() {
   yield takeLatest(permissionConstants.GET_PERMISSIONS, getPermissions);
}

function* createPermissionWatcher() {
   yield takeLatest(permissionConstants.CREATE_PERMISSION, createPermission);
}

function* updatePermissionWatcher() {
   yield takeLatest(permissionConstants.UPDATE_PERMISSION, updatePermission);
}

function* deletePermissionWatcher() {
   yield takeLatest(permissionConstants.DELETE_PERMISSION, deletePermission);
}

export default function* rootSaga() {
   yield all([
      getPermissionsWatcher(),
      createPermissionWatcher(),
      updatePermissionWatcher(),
      deletePermissionWatcher(),
   ]);
}
