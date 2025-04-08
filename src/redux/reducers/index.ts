import { combineReducers } from 'redux';
// import authRootReducer from './authentication.reducer';
import departmentRootReducer from './department.reducer';
import itemRootReducer from './item.reducer';
import reportRootReducer from './report.reducer';
import requestRootReducer from './request.reducer';
// import snackbarRootReducer from './snackbar.reducer';
// import userRootReducer from './user.reducer';

const rootReducer = combineReducers({
  //   auth: authRootReducer,
  department: departmentRootReducer,
  item: itemRootReducer,
  report: reportRootReducer,
  request: requestRootReducer,
  //   snackbar: snackbarRootReducer,
  //   user: userRootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
