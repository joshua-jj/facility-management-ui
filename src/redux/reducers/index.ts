import { combineReducers } from 'redux';
import authRootReducer from './authentication.reducer';
import dashboardRootReducer from './dashboard.reducer';
import departmentRootReducer from './department.reducer';
import forgotPasswordRootReducer from './forgotPassword.reducer';
import generatorRootReducer from './generator.reducer';
import reconciliationRootReducer from './reconciliation.reducer';
import itemRootReducer from './item.reducer';
import categoryRootReducer from './category.reducer';
import maintenanceRootReducer from './maintenance.reducer';
import reportRootReducer from './report.reducer';
import requestRootReducer from './request.reducer';
import roleRootReducer from './role.reducer';
import snackbarRootReducer from './snackbar.reducer';
import storeRootReducer from './store.reducer';
import userRootReducer from './user.reducer';
import maintenanceScheduleRootReducer from './maintenanceSchedule.reducer';
import meetingLocationRootReducer from './meetingLocation.reducer';
import meetingRootReducer from './meeting.reducer';
import permissionRootReducer from './permission.reducer';
import auditLogRootReducer from './auditLog.reducer';
import securityRootReducer from './security.reducer';
import incidenceLogRootReducer from './incidenceLog.reducer';
import notificationRootReducer from './notification.reducer';
import notificationsAdminReducer from './notificationsAdmin.reducer';
import workflowRootReducer from './workflow.reducer';
import cronReducer from './cron.reducer';
import configReducer from './config.reducer';

const rootReducer = combineReducers({
  auth: authRootReducer,
  dashboard: dashboardRootReducer,
  department: departmentRootReducer,
  forgotPassword: forgotPasswordRootReducer,
  generator: generatorRootReducer,
  reconciliation: reconciliationRootReducer,
  item: itemRootReducer,
  category: categoryRootReducer,
  maintenance: maintenanceRootReducer,
  report: reportRootReducer,
  request: requestRootReducer,
  role: roleRootReducer,
  snackbar: snackbarRootReducer,
  store: storeRootReducer,
  user: userRootReducer,
  maintenanceSchedule: maintenanceScheduleRootReducer,
  meetingLocation: meetingLocationRootReducer,
  meeting: meetingRootReducer,
  permission: permissionRootReducer,
  auditLog: auditLogRootReducer,
  security: securityRootReducer,
  incidenceLog: incidenceLogRootReducer,
  notification: notificationRootReducer,
  notificationsAdmin: notificationsAdminReducer,
  workflow: workflowRootReducer,
  cron: cronReducer,
  config: configReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
