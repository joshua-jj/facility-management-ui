import { all } from 'typed-redux-saga';
// import authRootSaga from './authentication.saga';
import departmentRootSaga from './department.saga';
import itemRootSaga from './item.saga';
import reportRootSaga from './report.saga';
// import userRootSaga from './user.saga';

export default function* rootSaga() {
  yield all([
    // authRootSaga(), 
    departmentRootSaga(),
    itemRootSaga(),
    reportRootSaga(),
    //  userRootSaga()
    ]);
}
