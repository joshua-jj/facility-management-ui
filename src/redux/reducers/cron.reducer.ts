import { UnknownAction } from 'redux';
import { cronConstants } from '@/constants/cron.constant';
import { SystemCronConfig } from '@/types/cron.types';

export interface CronState {
  list: SystemCronConfig[];
  isLoadingList: boolean;
  isSaving: boolean;
  isTriggering: boolean;
  isValidating: boolean;
  nextExecutions: string[];
  error: string | null;
  validationError: string | null;
}

const initialState: CronState = {
  list: [],
  isLoadingList: false,
  isSaving: false,
  isTriggering: false,
  isValidating: false,
  nextExecutions: [],
  error: null,
  validationError: null,
};

export default function cronReducer(state = initialState, action: UnknownAction & Record<string, unknown>): CronState {
  switch (action.type) {
    case cronConstants.REQUEST_GET_CRONS:
      return { ...state, isLoadingList: true, error: null };
    case cronConstants.GET_CRONS_SUCCESS:
      return { ...state, isLoadingList: false, list: action.crons as SystemCronConfig[] };
    case cronConstants.GET_CRONS_FAILURE:
      return { ...state, isLoadingList: false, error: (action.payload as string) ?? 'Failed to load crons' };

    case cronConstants.REQUEST_UPDATE_CRON:
      return { ...state, isSaving: true, error: null };
    case cronConstants.UPDATE_CRON_SUCCESS:
      return { ...state, isSaving: false };
    case cronConstants.UPDATE_CRON_FAILURE:
      return { ...state, isSaving: false, error: (action.payload as string) ?? 'Failed to update cron schedule' };

    case cronConstants.REQUEST_TRIGGER_CRON:
      return { ...state, isTriggering: true, error: null };
    case cronConstants.TRIGGER_CRON_SUCCESS:
    case cronConstants.TRIGGER_CRON_FAILURE:
      return { ...state, isTriggering: false };

    case cronConstants.REQUEST_VALIDATE_CRON:
      return { ...state, isValidating: true, validationError: null, nextExecutions: [] };
    case cronConstants.VALIDATE_CRON_SUCCESS:
      return { ...state, isValidating: false, nextExecutions: action.nextExecutions as string[] };
    case cronConstants.VALIDATE_CRON_FAILURE:
      return { ...state, isValidating: false, validationError: (action.payload as string) ?? 'Invalid cron expression' };

    default:
      return state;
  }
}
