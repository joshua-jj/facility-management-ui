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

interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface MeetingsPaginationState {
  meta: PaginationMeta;
}

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  itemCount: 0,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 1,
};

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

const pagination = (
  state: MeetingsPaginationState = { meta: defaultMeta },
  action: Action,
): MeetingsPaginationState => {
  switch (action.type) {
    case meetingConstants.GET_MEETINGS_SUCCESS: {
      if (!action.meta) return state;
      return { meta: action.meta };
    }
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
  pagination,
});

export default rootReducer;
