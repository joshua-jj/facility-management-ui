import { UnknownAction } from 'redux';
import { configConstants } from '@/constants/config.constant';
import { AppSetting, EffectiveConfig } from '@/types/config';

export interface ConfigState {
  effective: EffectiveConfig;
  settings: AppSetting[];
  isMutating: boolean;
}

const initialState: ConfigState = {
  effective: { facilityDepartmentId: null, generatorDepartmentId: null },
  settings: [],
  isMutating: false,
};

export default function configReducer(
  state = initialState,
  action: UnknownAction & Record<string, unknown>,
): ConfigState {
  switch (action.type) {
    case configConstants.REQUEST_GET_EFFECTIVE_CONFIG:
      return { ...state };
    case configConstants.GET_EFFECTIVE_CONFIG_SUCCESS:
      return { ...state, effective: action.effective as EffectiveConfig };
    case configConstants.GET_EFFECTIVE_CONFIG_FAILURE:
      return { ...state };

    case configConstants.REQUEST_GET_SETTINGS:
      return { ...state };
    case configConstants.GET_SETTINGS_SUCCESS:
      return { ...state, settings: action.settings as AppSetting[] };
    case configConstants.GET_SETTINGS_FAILURE:
      return { ...state };

    case configConstants.REQUEST_UPDATE_SETTING:
      return { ...state, isMutating: true };
    case configConstants.UPDATE_SETTING_SUCCESS:
      return { ...state, isMutating: false };
    case configConstants.UPDATE_SETTING_FAILURE:
      return { ...state, isMutating: false };

    default:
      return state;
  }
}
