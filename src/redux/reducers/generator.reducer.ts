import { combineReducers } from 'redux';
import { generatorConstants } from '@/constants';
import { LoadingState, GeneratorLog, GeneratorAction } from '@/types';

type GeneratorLogState = GeneratorLog[];

const IsRequestingGeneratorLogs = (
  state: LoadingState = false,
  action: GeneratorAction
): LoadingState => {
  switch (action.type) {
    case generatorConstants.REQUEST_GET_GENERATOR_LOGS:
      return true;
    case generatorConstants.GET_GENERATOR_LOGS_SUCCESS:
    case generatorConstants.GET_GENERATOR_LOGS_ERROR:
      return false;
    default:
      return state;
  }
};

const allGeneratorLogsList = (
  state: GeneratorLogState = [],
  action: GeneratorAction
): GeneratorLogState => {
  switch (action.type) {
    case generatorConstants.GET_GENERATOR_LOGS_SUCCESS:
      return action.data ?? state;
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingGeneratorLogs: (
    state: LoadingState | undefined,
    action: GeneratorAction
  ) => LoadingState;
  allGeneratorLogsList: (
    state: GeneratorLogState | undefined,
    action: GeneratorAction
  ) => GeneratorLogState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingGeneratorLogs,
  allGeneratorLogsList,
});

export default rootReducer;
