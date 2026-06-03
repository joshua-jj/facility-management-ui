export interface SystemCronConfig {
  id: number;
  key: string;
  name: string;
  description: string | null;
  cronExpression: string;
  defaultExpression: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdateCronPayload {
  cronExpression: string;
  isActive: boolean;
}

export interface ValidateCronResponse {
  nextExecutions: string[];
}
