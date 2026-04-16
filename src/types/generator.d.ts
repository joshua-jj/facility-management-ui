export interface GeneratorConstants {
  REQUEST_GET_GENERATOR_LOGS: string;
  GET_GENERATOR_LOGS_SUCCESS: string;
  GET_GENERATOR_LOGS_ERROR: string;

  REQUEST_CREATE_GENERATOR_LOG: string;
  CREATE_GENERATOR_LOG_SUCCESS: string;
  CREATE_GENERATOR_LOG_ERROR: string;

  REQUEST_UPDATE_GENERATOR_LOG: string;
  UPDATE_GENERATOR_LOG_SUCCESS: string;
  UPDATE_GENERATOR_LOG_ERROR: string;

  REQUEST_SEARCH_GENERATOR_LOG: string;
  SEARCH_GENERATOR_LOG_SUCCESS: string;
  SEARCH_GENERATOR_LOG_ERROR: string;

  GET_GENERATOR_LOGS: string;
  CREATE_GENERATOR_LOG: string;
  UPDATE_GENERATOR_LOG: string;
  SEARCH_GENERATOR_LOG: string;

  GENERATOR_URI: string;
}
export interface GeneratorForm {
  id?: number;
  meetingId: number;
  locationId: number;
  generatorTypeId: number;
  generatorType?: string;
  dieselLevelOn: number;
  dieselLevelOff: number;
  // dueForService?: boolean;
  // generatorCurrent?: number;
  // personnelName: string;
  onTime: string;
  offTime: string;
  lastServiceHour: string;
  nextServiceHour: string;
  engineStartHours: string;
  engineOffHours: string;
  remark: string;
}

export interface GeneratorLog {
  id: number;
  meeting?: { id: number; name: string };
  location?: { id: number; name: string };
  /** @deprecated use meeting.name */
  nameOfMeeting?: string;
  /** @deprecated use location.name */
  meetingLocation?: string;
  generatorType: string;
  onTime: string;
  offTime: string;
  // hoursUsed: string;
  engineStartHours: string;
  engineOffHours: string;
  dieselLevelOn: string;
  dieselLevelOff: string;
  lastServiceHour: string;
  nextServiceHour: string;
  personnelName: string;
  generatorTypeId: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status?: number;
  // generatorName: string;
  // generatorStatus: string;
  // generatorPower: number;
  // generatorFuel: number;
  // generatorTemperature: number;
  // generatorVoltage: number;
  // generatorCurrent: number;
  // generatorFrequency: number;
}
export interface GeneratorState {
  generators: GeneratorLog[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  generator: GeneratorLog | null;
  generatorForm: GeneratorForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
  loadingState: LoadingState;
}
export interface GeneratorAction {
  type: string;
  logs?: GeneratorLog[];
  generator?: GeneratorLog;
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  generatorForm?: GeneratorForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
  generatorLogs?: GeneratorLog[];
  generatorLog?: GeneratorLog;
  generatorFormData?: GeneratorForm;
  generatorLogData?: GeneratorLog;
  generatorLogId?: number;
  generatorLogStatus?: string;
  generatorLogType?: string;
  generatorLogDescription?: string;
  generatorLogDate?: string;
  generatorLogDuration?: number;
  generatorLogName?: string;
}
