import { generatorConstants } from '@/constants';

interface GetGeneratorLogsAction {
  type: typeof generatorConstants.GET_GENERATOR_LOGS;
}

const getGeneratorLogs = (): GetGeneratorLogsAction => ({
  type: generatorConstants.GET_GENERATOR_LOGS,
});

export const generatorActions = {
  getGeneratorLogs,
};
