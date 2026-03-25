import { combineReducers } from 'redux';
import authRootReducer from './authentication.reducer';
import dashboardRootReducer from './dashboard.reducer';
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
import dashboardRootReducer from './dashboard.reducer';
import maintenanceScheduleRootReducer from './maintenanceSchedule.reducer';

const rootReducer = combineReducers({
  auth: authRootReducer,
  dashboard: dashboardRootReducer,
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
  dashboard: dashboardRootReducer,
  maintenanceSchedule: maintenanceScheduleRootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
