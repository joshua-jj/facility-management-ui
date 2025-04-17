import { combineReducers } from 'redux';
import { roleConstants } from '@/constants';
import { Role, RoleAction } from '@/types';

type RolesListState = Role[];

const allRolesList = (
  state: RolesListState = [],
  action: RoleAction
): RolesListState => {
  switch (action.type) {
    case roleConstants.GET_ROLES_SUCCESS:
      return action.roles ?? state;
    default:
      return state;
  }
};

export interface RootState {
  allRolesList: (
    state: RolesListState | undefined,
    action: RoleAction
  ) => RolesListState;
}

const rootReducer = combineReducers<RootState>({
  allRolesList,
});

export default rootReducer;
