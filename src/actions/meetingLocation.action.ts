import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import { MeetingLocationForm, MeetingLocationUpdateForm } from '@/types/meetingLocation';

export interface GetMeetingLocationsAction {
  type: typeof meetingLocationConstants.GET_MEETING_LOCATIONS;
  data?: { page?: number; limit?: number; append?: boolean; search?: string; status?: string };
}

export interface CreateMeetingLocationAction {
  type: typeof meetingLocationConstants.CREATE_MEETING_LOCATION;
  data: MeetingLocationForm;
}

export interface UpdateMeetingLocationAction {
  type: typeof meetingLocationConstants.UPDATE_MEETING_LOCATION;
  data: MeetingLocationUpdateForm;
}

export interface DeleteMeetingLocationAction {
  type: typeof meetingLocationConstants.DELETE_MEETING_LOCATION;
  id: number;
}

const getMeetingLocations = (data?: { page?: number; limit?: number; append?: boolean; search?: string; status?: string }): GetMeetingLocationsAction => ({
  type: meetingLocationConstants.GET_MEETING_LOCATIONS,
  data,
});

const createMeetingLocation = (data: MeetingLocationForm): CreateMeetingLocationAction => ({
  type: meetingLocationConstants.CREATE_MEETING_LOCATION,
  data,
});

const updateMeetingLocation = (data: MeetingLocationUpdateForm): UpdateMeetingLocationAction => ({
  type: meetingLocationConstants.UPDATE_MEETING_LOCATION,
  data,
});

const deleteMeetingLocation = (id: number): DeleteMeetingLocationAction => ({
  type: meetingLocationConstants.DELETE_MEETING_LOCATION,
  id,
});

export const meetingLocationActions = {
  getMeetingLocations,
  createMeetingLocation,
  updateMeetingLocation,
  deleteMeetingLocation,
};
