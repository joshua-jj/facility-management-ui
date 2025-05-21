import { combineReducers } from 'redux';
import { generatorConstants } from '@/constants';
import { LoadingState, GeneratorLog, Action, GeneratorAction } from '@/types';

type GeneratorLogState = GeneratorLog[];

interface AllGeneratorLogsAction extends Action {
  logs: {
    items: GeneratorLog[];
  };
}

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

const IsCreatingGeneratorLog = (
  state: LoadingState = false,
  action: GeneratorAction
): LoadingState => {
  switch (action.type) {
    case generatorConstants.REQUEST_CREATE_GENERATOR_LOG:
      return true;
    case generatorConstants.CREATE_GENERATOR_LOG_SUCCESS:
    case generatorConstants.CREATE_GENERATOR_LOG_ERROR:
      return false;
    default:
      return state;
  }
};

const allGeneratorLogsList = (
  state: GeneratorLogState = [],
  action: AllGeneratorLogsAction
): GeneratorLogState => {
  switch (action.type) {
    case generatorConstants.GET_GENERATOR_LOGS_SUCCESS:
      return action.logs?.items ?? state;
    default:
      return state;
  }
};

export interface RootState {
  IsRequestingGeneratorLogs: (
    state: LoadingState | undefined,
    action: GeneratorAction
  ) => LoadingState;
  IsCreatingGeneratorLog: (
    state: LoadingState | undefined,
    action: GeneratorAction
  ) => LoadingState;
  allGeneratorLogsList: (
    state: GeneratorLogState | undefined,
    action: AllGeneratorLogsAction
  ) => GeneratorLogState;
}

const rootReducer = combineReducers<RootState>({
  IsRequestingGeneratorLogs,
  IsCreatingGeneratorLog,
  allGeneratorLogsList,
});

export default rootReducer;
