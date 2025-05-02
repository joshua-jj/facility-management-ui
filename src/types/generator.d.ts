export interface GeneratorConstants {
  REQUEST_GET_GENERATOR_LOGS: string;
  GET_GENERATOR_LOGS_SUCCESS: string;
  GET_GENERATOR_LOGS_ERROR: string;

  REQUEST_CREATE_GENERATOR_LOG: string;
  CREATE_GENERATOR_LOG_SUCCESS: string;
  CREATE_GENERATOR_LOG_ERROR: string;

  GET_GENERATOR_LOGS: string;
  CREATE_GENERATOR_LOG: string;

  GENERATOR_URI: string;
}
export interface GeneratorForm {
  generatorName: string;
  generatorStatus: string;
  generatorPower: number;
  generatorFuel: number;
  generatorTemperature: number;
  generatorVoltage: number;
  generatorCurrent: number;
  generatorFrequency: number;
}
export interface GeneratorLog {
  id: number;
  nameOfMeeting: string;
  generatorType: string;
  meetingLocation: string;
  onTime: string;
  offTime: string;
  hoursUsed: string;
  engineStartHours: string;
  status?: number;
  // generatorName: string;
  // generatorStatus: string;
  // generatorPower: number;
  // generatorFuel: number;
  // generatorTemperature: number;
  // generatorVoltage: number;
  // generatorCurrent: number;
  // generatorFrequency: number;
  // createdAt: string;
  // updatedAt: string;
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
