export interface MeetingLocation {
  id: number;
  name: string;
  status?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MeetingLocationForm {
  name: string;
}

export interface MeetingLocationUpdateForm {
  id: number;
  name: string;
}
