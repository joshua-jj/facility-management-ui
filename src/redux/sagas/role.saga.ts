import { put, takeLatest, all } from 'typed-redux-saga';
import { roleConstants } from '@/constants';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

function* getRoles() {
  yield put({ type: roleConstants.REQUEST_GET_ROLES });

  try {
    const roleUri = `${roleConstants.ROLE_URI}`;

    const jsonResponse = yield* authenticatedRequest(roleUri, { method: 'GET' });
    if (!jsonResponse) return;

    yield put({
      type: roleConstants.GET_ROLES_SUCCESS,
      roles: jsonResponse?.items,
    });
  } catch (error: unknown) {
    yield* handleSagaError(error, roleConstants.GET_ROLES_ERROR, false);
  }
}

function* getRolesWatcher() {
  yield takeLatest(roleConstants.GET_ROLES, getRoles);
}

export default function* rootSaga() {
  yield all([getRolesWatcher()]);
}
