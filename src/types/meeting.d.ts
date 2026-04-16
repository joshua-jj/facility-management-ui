import { MeetingLocation } from './meetingLocation';

export interface Meeting {
  id: number;
  name: string;
  location: MeetingLocation;
  status?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MeetingForm {
  name: string;
  locationId: number;
}

export interface MeetingUpdateForm {
  id: number;
  name: string;
  locationId: number;
}
