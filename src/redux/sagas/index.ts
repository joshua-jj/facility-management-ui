import { all } from 'typed-redux-saga';
import authRootSaga from './authentication.saga';
import departmentRootSaga from './department.saga';
import generatorRootSaga from './generator.saga';
import itemRootSaga from './item.saga';
import maintenanceRootSaga from './maintenance.saga';
import reportRootSaga from './report.saga';
import requestRootSaga from './request.saga';
import storeRootSaga from './store.saga';
// import userRootSaga from './user.saga';

export default function* rootSaga() {
  yield all([
    authRootSaga(),
    departmentRootSaga(),
    generatorRootSaga(),
    itemRootSaga(),
    maintenanceRootSaga(),
    reportRootSaga(),
    requestRootSaga(),
    storeRootSaga(),
    //  userRootSaga()
  ]);
}
