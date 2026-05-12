import { workflowConstants } from '@/constants/workflow.constant';
import { WorkflowReplaceBody } from '@/types/workflow';

export interface ListWorkflowsAction {
   type: typeof workflowConstants.GET_WORKFLOWS;
}

export interface GetWorkflowAction {
   type: typeof workflowConstants.GET_WORKFLOW;
   subject: string;
}

export interface ReplaceTransitionsAction {
   type: typeof workflowConstants.REPLACE_TRANSITIONS;
   subject: string;
   body: WorkflowReplaceBody;
}

const listWorkflows = (): ListWorkflowsAction => ({
   type: workflowConstants.GET_WORKFLOWS,
});

const getWorkflow = (data: { subject: string }): GetWorkflowAction => ({
   type: workflowConstants.GET_WORKFLOW,
   subject: data.subject,
});

const replaceTransitions = (data: {
   subject: string;
   body: WorkflowReplaceBody;
}): ReplaceTransitionsAction => ({
   type: workflowConstants.REPLACE_TRANSITIONS,
   subject: data.subject,
   body: data.body,
});

export const workflowActions = {
   listWorkflows,
   getWorkflow,
   replaceTransitions,
};
