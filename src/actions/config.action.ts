import { configConstants } from '@/constants/config.constant';

export interface GetEffectiveConfigAction {
  type: typeof configConstants.GET_EFFECTIVE_CONFIG;
}

export interface GetSettingsAction {
  type: typeof configConstants.GET_SETTINGS;
}

export interface UpdateSettingAction {
  type: typeof configConstants.UPDATE_SETTING;
  key: string;
  value: string | null;
}

export interface ResetSettingAction {
  type: typeof configConstants.RESET_SETTING;
  key: string;
}

export const configActions = {
  getEffectiveConfig: (): GetEffectiveConfigAction => ({
    type: configConstants.GET_EFFECTIVE_CONFIG,
  }),

  getSettings: (): GetSettingsAction => ({
    type: configConstants.GET_SETTINGS,
  }),

  updateSetting: (key: string, value: string | null): UpdateSettingAction => ({
    type: configConstants.UPDATE_SETTING,
    key,
    value,
  }),

  resetSetting: (key: string): ResetSettingAction => ({
    type: configConstants.RESET_SETTING,
    key,
  }),
};
