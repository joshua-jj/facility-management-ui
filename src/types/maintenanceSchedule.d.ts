export interface MaintenanceSchedule {
  id: number;
  title: string;
  description: string;
  scheduledDate: string;
  itemId: number | null;
  scheduleStatus: string;
  completedDate: string | null;
  status: string;
  createdAt: string;
  createdBy: string;
}

export interface MaintenanceScheduleForm {
  title: string;
  description: string;
  scheduledDate: string;
  itemId?: number;
}
