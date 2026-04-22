import { appConstants } from './app.constant';

const permission: string = 'permission';

export const permissionConstants = {
   PERMISSION_URI: `${appConstants.BASE_URI}${permission}`,
   PERMISSION_ALL_URI: `${appConstants.BASE_URI}${permission}/all`,

   GET_PERMISSIONS: 'GET_PERMISSIONS',
   REQUEST_GET_PERMISSIONS: 'REQUEST_GET_PERMISSIONS',
   GET_PERMISSIONS_SUCCESS: 'GET_PERMISSIONS_SUCCESS',
   GET_PERMISSIONS_FAILURE: 'GET_PERMISSIONS_FAILURE',
};
