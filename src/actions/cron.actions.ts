import { cronConstants } from '@/constants/cron.constant';
import { UpdateCronPayload } from '@/types/cron.types';

export interface GetCronsAction {
  type: typeof cronConstants.GET_CRONS;
}

export interface UpdateCronAction {
  type: typeof cronConstants.UPDATE_CRON;
  key: string;
  body: UpdateCronPayload;
}

export interface TriggerCronAction {
  type: typeof cronConstants.TRIGGER_CRON;
  key: string;
}

export interface ValidateCronAction {
  type: typeof cronConstants.VALIDATE_CRON;
  cronExpression: string;
}

export const cronActions = {
  getCrons: (): GetCronsAction => ({
    type: cronConstants.GET_CRONS,
  }),

  updateCron: (key: string, body: UpdateCronPayload): UpdateCronAction => ({
    type: cronConstants.UPDATE_CRON,
    key,
    body,
  }),

  triggerCron: (key: string): TriggerCronAction => ({
    type: cronConstants.TRIGGER_CRON,
    key,
  }),

  validateCron: (cronExpression: string): ValidateCronAction => ({
    type: cronConstants.VALIDATE_CRON,
    cronExpression,
  }),
};
