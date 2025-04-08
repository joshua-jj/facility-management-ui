import { RequestConstants } from '@/types';
import { appConstants } from './app.constant';

const report: string = 'complaint';

export const requestConstants: RequestConstants = {
  REQUEST_CREATE_REQUEST: 'REQUEST_CREATE_REQUEST',
  CREATE_REQUEST_SUCCESS: 'CREATE_REQUEST_SUCCESS',
  CREATE_REQUEST_ERROR: 'CREATE_REQUEST_ERROR',

  CREATE_REQUEST: 'CREATE_REQUEST',

  REQUEST_URI: `${appConstants.BASE_URI}${report}`,
};
