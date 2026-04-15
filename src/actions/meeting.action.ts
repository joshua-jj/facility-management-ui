import { meetingConstants } from '@/constants/meeting.constant';
import { MeetingForm, MeetingUpdateForm } from '@/types/meeting';

export interface GetMeetingsAction {
  type: typeof meetingConstants.GET_MEETINGS;
  data?: { page?: number };
}

export interface CreateMeetingAction {
  type: typeof meetingConstants.CREATE_MEETING;
  data: MeetingForm;
}

export interface UpdateMeetingAction {
  type: typeof meetingConstants.UPDATE_MEETING;
  data: MeetingUpdateForm;
}

export interface DeleteMeetingAction {
  type: typeof meetingConstants.DELETE_MEETING;
  id: number;
}

const getMeetings = (data?: { page?: number }): GetMeetingsAction => ({
  type: meetingConstants.GET_MEETINGS,
  data,
});

const createMeeting = (data: MeetingForm): CreateMeetingAction => ({
  type: meetingConstants.CREATE_MEETING,
  data,
});

const updateMeeting = (data: MeetingUpdateForm): UpdateMeetingAction => ({
  type: meetingConstants.UPDATE_MEETING,
  data,
});

const deleteMeeting = (id: number): DeleteMeetingAction => ({
  type: meetingConstants.DELETE_MEETING,
  id,
});

export const meetingActions = {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
};
