import { roleConstants } from '@/constants';

interface GetRolesAction {
  type: typeof roleConstants.GET_ROLES;
}

const getRoles = (): GetRolesAction => ({
  type: roleConstants.GET_ROLES,
});

export const roleActions = {
  getRoles,
};
