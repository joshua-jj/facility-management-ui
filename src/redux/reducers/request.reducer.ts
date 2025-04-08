import { combineReducers } from 'redux';
import { requestConstants } from '../../constants';
import { Action, LoadingState } from '@/types';

const IsCreatingRequest = (
  state: LoadingState = false,
  action: Action
): LoadingState => {
  switch (action.type) {
    case requestConstants.REQUEST_CREATE_REQUEST:
      return true;
    case requestConstants.CREATE_REQUEST_SUCCESS:
    case requestConstants.CREATE_REQUEST_ERROR:
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
  IsCreatingRequest: (
    state: LoadingState | undefined,
    action: Action
  ) => LoadingState;
  //   pagination: PaginationState;
  //   list: EventListState;
}

const rootReducer = combineReducers<RootState>({
  IsCreatingRequest,
  //   pagination,
  //   list,
});

export default rootReducer;
