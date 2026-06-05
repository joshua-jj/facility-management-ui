export interface AppSetting {
  id: number;
  key: string;
  label: string;
  description: string | null;
  group: string;
  valueType: string;
  value: string | null;
  defaultValue: string | null;
}

export interface EffectiveConfig {
  facilityDepartmentId: number | null;
  generatorDepartmentId: number | null;
}
