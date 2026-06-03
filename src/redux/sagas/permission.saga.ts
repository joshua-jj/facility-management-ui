import { put, takeLatest, all } from 'typed-redux-saga';
import { permissionConstants } from '@/constants/permission.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';

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


function* getPermissionsWatcher() {
   yield takeLatest(permissionConstants.GET_PERMISSIONS, getPermissions);
}

export default function* rootSaga() {
   yield all([getPermissionsWatcher()]);
}
