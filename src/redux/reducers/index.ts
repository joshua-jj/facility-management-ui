import { combineReducers } from 'redux';
// import authRootReducer from './authentication.reducer';
import departmentRootReducer from './department.reducer';
import generatorRootReducer from './generator.reducer';
import itemRootReducer from './item.reducer';
import maintenanceRootReducer from './maintenance.reducer';
import reportRootReducer from './report.reducer';
import requestRootReducer from './request.reducer';
// import snackbarRootReducer from './snackbar.reducer';
import storeRootReducer from './store.reducer';
// import userRootReducer from './user.reducer';

const rootReducer = combineReducers({
  //   auth: authRootReducer,
  department: departmentRootReducer,
  generator: generatorRootReducer,
  item: itemRootReducer,
  maintenance: maintenanceRootReducer,
  report: reportRootReducer,
  request: requestRootReducer,
  //   snackbar: snackbarRootReducer,
  store: storeRootReducer,
  //   user: userRootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
