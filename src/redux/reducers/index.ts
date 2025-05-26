import { combineReducers } from 'redux';
import authRootReducer from './authentication.reducer';
import departmentRootReducer from './department.reducer';
import forgotPasswordRootReducer from './forgotPassword.reducer';
import generatorRootReducer from './generator.reducer';
import itemRootReducer from './item.reducer';
import maintenanceRootReducer from './maintenance.reducer';
import reportRootReducer from './report.reducer';
import requestRootReducer from './request.reducer';
import roleRootReducer from './role.reducer';
import snackbarRootReducer from './snackbar.reducer';
import storeRootReducer from './store.reducer';
import userRootReducer from './user.reducer';

const rootReducer = combineReducers({
  auth: authRootReducer,
  department: departmentRootReducer,
  forgotPassword: forgotPasswordRootReducer,
  generator: generatorRootReducer,
  item: itemRootReducer,
  maintenance: maintenanceRootReducer,
  report: reportRootReducer,
  request: requestRootReducer,
  role: roleRootReducer,
  snackbar: snackbarRootReducer,
  store: storeRootReducer,
  user: userRootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
