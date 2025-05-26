import { generatorConstants } from '@/constants';
import { GeneratorForm } from '@/types';

interface GetGeneratorLogsAction {
  type: typeof generatorConstants.GET_GENERATOR_LOGS;
}

export interface CreateGeneratorLogAction {
  type: typeof generatorConstants.CREATE_GENERATOR_LOG;
  data: GeneratorForm;
}

export interface SearchGeneratorAction {
  type: typeof generatorConstants.SEARCH_GENERATOR_LOG;
  data: { text: string };
}

const getGeneratorLogs = (): GetGeneratorLogsAction => ({
  type: generatorConstants.GET_GENERATOR_LOGS,
});

const createGeneratorLog = (data: GeneratorForm): CreateGeneratorLogAction => ({
  type: generatorConstants.CREATE_GENERATOR_LOG,
  data,
});
const searchGenerator = (data: { text: string }): SearchGeneratorAction => ({
  type: generatorConstants.SEARCH_GENERATOR_LOG,
  data,
});

export const generatorActions = {
  getGeneratorLogs,
  createGeneratorLog,
  searchGenerator,
};
