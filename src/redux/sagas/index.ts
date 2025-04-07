import { all } from 'typed-redux-saga';
// import authRootSaga from './authentication.saga';
import reportRootSaga from './report.saga';
// import userRootSaga from './user.saga';

export default function* rootSaga() {
  yield all([
    // authRootSaga(), 
    reportRootSaga(),
    //  userRootSaga()
    ]);
}
