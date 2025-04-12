import { GeneratorConstants } from '@/types';
import { appConstants } from './app.constant';

const generator: string = 'generator-log';

export const generatorConstants: GeneratorConstants = {
  REQUEST_GET_GENERATOR_LOGS: 'REQUEST_GET_GENERATOR_LOGS',
  GET_GENERATOR_LOGS_SUCCESS: 'GET_GENERATOR_LOGS_SUCCESS',
  GET_GENERATOR_LOGS_ERROR: 'GET_GENERATOR_LOGS_ERROR',

  GET_GENERATOR_LOGS: 'GET_GENERATOR_LOGS',

  GENERATOR_URI: `${appConstants.BASE_URI}${generator}`,
};
