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

interface PaginationMeta {
  currentPage: number;
  itemCount: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface MeetingLocationsPaginationState {
  meta: PaginationMeta;
}

const defaultMeta: PaginationMeta = {
  currentPage: 1,
  itemCount: 0,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 1,
};

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
    case meetingLocationConstants.GET_MEETING_LOCATIONS_SUCCESS: {
      const incoming: MeetingLocation[] = action.meetingLocations ?? [];
      if (action.append) {
        // Append and dedupe by id
        const existingIds = new Set(state.map((item) => item.id));
        const newItems = incoming.filter((item) => !existingIds.has(item.id));
        return [...state, ...newItems];
      }
      return incoming;
    }
    default:
      return state;
  }
};

const pagination = (
  state: MeetingLocationsPaginationState = { meta: defaultMeta },
  action: Action,
): MeetingLocationsPaginationState => {
  switch (action.type) {
    case meetingLocationConstants.GET_MEETING_LOCATIONS_SUCCESS: {
      if (!action.meta) return state;
      return { meta: action.meta };
    }
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
  pagination,
});

export default rootReducer;
