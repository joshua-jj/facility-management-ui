import { combineReducers } from 'redux';
import { workflowConstants } from '@/constants/workflow.constant';
import {
   WorkflowDetail,
   WorkflowSummary,
} from '@/types/workflow';

interface Action {
   type: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [key: string]: any;
}

const list = (state: WorkflowSummary[] = [], action: Action): WorkflowSummary[] => {
   switch (action.type) {
      case workflowConstants.GET_WORKFLOWS_SUCCESS:
         return (action.workflows as WorkflowSummary[]) ?? [];
      default:
         return state;
   }
};

const current = (state: WorkflowDetail | null = null, action: Action): WorkflowDetail | null => {
   switch (action.type) {
      case workflowConstants.GET_WORKFLOW_SUCCESS:
         return (action.workflow as WorkflowDetail) ?? null;
      case workflowConstants.REQUEST_GET_WORKFLOW:
         // Clear on a new load so the editor doesn't briefly render
         // the previous workflow's nodes during the round-trip.
         return null;
      default:
         return state;
   }
};

const isLoadingList = (state = false, action: Action): boolean => {
   switch (action.type) {
      case workflowConstants.REQUEST_GET_WORKFLOWS:
         return true;
      case workflowConstants.GET_WORKFLOWS_SUCCESS:
      case workflowConstants.GET_WORKFLOWS_FAILURE:
         return false;
      default:
         return state;
   }
};

const isLoadingCurrent = (state = false, action: Action): boolean => {
   switch (action.type) {
      case workflowConstants.REQUEST_GET_WORKFLOW:
         return true;
      case workflowConstants.GET_WORKFLOW_SUCCESS:
      case workflowConstants.GET_WORKFLOW_FAILURE:
         return false;
      default:
         return state;
   }
};

const isSaving = (state = false, action: Action): boolean => {
   switch (action.type) {
      case workflowConstants.REQUEST_REPLACE_TRANSITIONS:
         return true;
      case workflowConstants.REPLACE_TRANSITIONS_SUCCESS:
      case workflowConstants.REPLACE_TRANSITIONS_FAILURE:
         return false;
      default:
         return state;
   }
};

const error = (state: string | null = null, action: Action): string | null => {
   switch (action.type) {
      case workflowConstants.GET_WORKFLOWS_FAILURE:
      case workflowConstants.GET_WORKFLOW_FAILURE:
      case workflowConstants.REPLACE_TRANSITIONS_FAILURE:
         return (action.error as string) ?? 'Something went wrong';
      case workflowConstants.REQUEST_GET_WORKFLOWS:
      case workflowConstants.REQUEST_GET_WORKFLOW:
      case workflowConstants.REQUEST_REPLACE_TRANSITIONS:
      case workflowConstants.GET_WORKFLOWS_SUCCESS:
      case workflowConstants.GET_WORKFLOW_SUCCESS:
      case workflowConstants.REPLACE_TRANSITIONS_SUCCESS:
         return null;
      default:
         return state;
   }
};

const workflowRootReducer = combineReducers({
   list,
   current,
   isLoadingList,
   isLoadingCurrent,
   isSaving,
   error,
});

export default workflowRootReducer;
