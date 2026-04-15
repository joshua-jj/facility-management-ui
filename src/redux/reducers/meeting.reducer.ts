import { combineReducers } from 'redux';
import { meetingConstants } from '@/constants/meeting.constant';
import { Meeting } from '@/types/meeting';

interface Action {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type LoadingState = boolean;
type MeetingsListState = Meeting[];

const IsRequestingMeetings = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingConstants.REQUEST_GET_MEETINGS:
      return true;
    case meetingConstants.GET_MEETINGS_SUCCESS:
    case meetingConstants.GET_MEETINGS_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsCreatingMeeting = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingConstants.REQUEST_CREATE_MEETING:
      return true;
    case meetingConstants.CREATE_MEETING_SUCCESS:
    case meetingConstants.CREATE_MEETING_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsUpdatingMeeting = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingConstants.REQUEST_UPDATE_MEETING:
      return true;
    case meetingConstants.UPDATE_MEETING_SUCCESS:
    case meetingConstants.UPDATE_MEETING_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsDeletingMeeting = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingConstants.REQUEST_DELETE_MEETING:
      return true;
    case meetingConstants.DELETE_MEETING_SUCCESS:
    case meetingConstants.DELETE_MEETING_FAILURE:
      return false;
    default:
      return state;
  }
};

const allMeetingsList = (
  state: MeetingsListState = [],
  action: Action,
): MeetingsListState => {
  switch (action.type) {
    case meetingConstants.GET_MEETINGS_SUCCESS:
      return action.meetings ?? state;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingMeetings,
  IsCreatingMeeting,
  IsUpdatingMeeting,
  IsDeletingMeeting,
  allMeetingsList,
});

export default rootReducer;
