import { generatorConstants } from '@/constants';
import { GeneratorForm } from '@/types';

export interface GetGeneratorLogsAction {
  type: typeof generatorConstants.GET_GENERATOR_LOGS;
  data?: { page: number };
}

export interface CreateGeneratorLogAction {
  type: typeof generatorConstants.CREATE_GENERATOR_LOG;
  data: GeneratorForm;
}

export interface UpdateGeneratorLogAction {
  type: typeof generatorConstants.UPDATE_GENERATOR_LOG;
  data: GeneratorForm;
}

export interface SearchGeneratorLogAction {
  type: typeof generatorConstants.SEARCH_GENERATOR_LOG;
  data: { text: string };
}

const getGeneratorLogs = (data?: { page: number }): GetGeneratorLogsAction => ({
  type: generatorConstants.GET_GENERATOR_LOGS,
  data,
});

const createGeneratorLog = (data: GeneratorForm): CreateGeneratorLogAction => ({
  type: generatorConstants.CREATE_GENERATOR_LOG,
  data,
});

const updateGeneratorLog = (data: GeneratorForm): UpdateGeneratorLogAction => ({
  type: generatorConstants.UPDATE_GENERATOR_LOG,
  data,
});

const searchGeneratorLog = (data: {
  text: string;
}): SearchGeneratorLogAction => ({
  type: generatorConstants.SEARCH_GENERATOR_LOG,
  data,
});

export const generatorActions = {
  getGeneratorLogs,
  createGeneratorLog,
  updateGeneratorLog,
  searchGeneratorLog,
};
