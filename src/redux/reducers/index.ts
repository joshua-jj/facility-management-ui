import { combineReducers } from 'redux';
// import authRootReducer from './authentication.reducer';
import reportRootReducer from './report.reducer';
// import snackbarRootReducer from './snackbar.reducer';
// import userRootReducer from './user.reducer';

const rootReducer = combineReducers({
//   auth: authRootReducer,
  report: reportRootReducer,
//   snackbar: snackbarRootReducer,
//   user: userRootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
