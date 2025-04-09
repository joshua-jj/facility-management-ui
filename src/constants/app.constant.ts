import { AppConstants, Environment } from '@/types';

const env: Environment = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
};

export const appConstants: AppConstants = {
  BASE_URI: env.baseUrl,

  KEY_PREFIX: 'Facility_Store_',

  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_SNACKBAR: 'SET_SNACKBAR',
  CLEAR_SNACKBAR: 'CLEAR_SNACKBAR',
};
