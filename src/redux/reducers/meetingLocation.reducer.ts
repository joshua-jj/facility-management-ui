import { combineReducers } from 'redux';
import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import { MeetingLocation } from '@/types/meetingLocation';

interface Action {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type LoadingState = boolean;
type MeetingLocationsListState = MeetingLocation[];

const IsRequestingMeetingLocations = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingLocationConstants.REQUEST_GET_MEETING_LOCATIONS:
      return true;
    case meetingLocationConstants.GET_MEETING_LOCATIONS_SUCCESS:
    case meetingLocationConstants.GET_MEETING_LOCATIONS_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsCreatingMeetingLocation = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingLocationConstants.REQUEST_CREATE_MEETING_LOCATION:
      return true;
    case meetingLocationConstants.CREATE_MEETING_LOCATION_SUCCESS:
    case meetingLocationConstants.CREATE_MEETING_LOCATION_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsUpdatingMeetingLocation = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingLocationConstants.REQUEST_UPDATE_MEETING_LOCATION:
      return true;
    case meetingLocationConstants.UPDATE_MEETING_LOCATION_SUCCESS:
    case meetingLocationConstants.UPDATE_MEETING_LOCATION_FAILURE:
      return false;
    default:
      return state;
  }
};

const IsDeletingMeetingLocation = (
  state: LoadingState = false,
  action: Action,
): LoadingState => {
  switch (action.type) {
    case meetingLocationConstants.REQUEST_DELETE_MEETING_LOCATION:
      return true;
    case meetingLocationConstants.DELETE_MEETING_LOCATION_SUCCESS:
    case meetingLocationConstants.DELETE_MEETING_LOCATION_FAILURE:
      return false;
    default:
      return state;
  }
};

const allMeetingLocationsList = (
  state: MeetingLocationsListState = [],
  action: Action,
): MeetingLocationsListState => {
  switch (action.type) {
    case meetingLocationConstants.GET_MEETING_LOCATIONS_SUCCESS:
      return action.meetingLocations ?? state;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  IsRequestingMeetingLocations,
  IsCreatingMeetingLocation,
  IsUpdatingMeetingLocation,
  IsDeletingMeetingLocation,
  allMeetingLocationsList,
});

export default rootReducer;
