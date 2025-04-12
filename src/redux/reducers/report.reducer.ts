import { combineReducers } from 'redux';
import { reportConstants } from '@/constants';
import { Action, LoadingState } from '@/types';

// interface Event {
//   id: string;
//   title: string; // Example property, adjust as needed
//   // Add other event properties as needed
// }

// type EventListState = Event[];

const IsCreatingReport = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case reportConstants.REQUEST_SEND_REPORT:
      return true;
    case reportConstants.SEND_REPORT_SUCCESS:
    case reportConstants.SEND_REPORT_ERROR:
      return false;
    default:
      return state;
  }
};

// const list = (state: EventListState = [], action: Action): EventListState => {
//   switch (action.type) {
//     case eventConstants.GET_ALL_EVENTS_SUCCESS:
//       return action.events?.data ?? state;
//     case eventConstants.SEARCH_EVENT_SUCCESS:
//       return action.event?.data ?? state;
//     default:
//       return state;
//   }
// };

// const pagination = (
//   state: PaginationState = null,
//   action: Action
// ): PaginationState => {
//   switch (action.type) {
//     case eventConstants.GET_ALL_EVENTS_SUCCESS:
//       return action.pagination ?? state;
//     default:
//       return state;
//   }
// };

export interface RootState {
  IsCreatingReport: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  //   pagination: PaginationState;
  //   list: EventListState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingReport,
  //   pagination,
  //   list,
});

export default rootReducer;
