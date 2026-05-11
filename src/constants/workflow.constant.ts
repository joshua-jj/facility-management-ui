import { appConstants } from './app.constant';

/**
 * Action types + API URIs for the Workflow Rules admin module.
 *
 * The base URI matches the API controller (`@Controller({ path:
 * 'workflow', version: '1' })`), so `WORKFLOW_URI` resolves to
 * `${BASE_URI}workflow` — no trailing slash, callers append `/:subject`
 * or `/:subject/transitions` as needed.
 */
export const workflowConstants = {
   WORKFLOW_URI: `${appConstants.BASE_URI}workflow`,

   GET_WORKFLOWS: 'GET_WORKFLOWS',
   REQUEST_GET_WORKFLOWS: 'REQUEST_GET_WORKFLOWS',
   GET_WORKFLOWS_SUCCESS: 'GET_WORKFLOWS_SUCCESS',
   GET_WORKFLOWS_FAILURE: 'GET_WORKFLOWS_FAILURE',

   GET_WORKFLOW: 'GET_WORKFLOW',
   REQUEST_GET_WORKFLOW: 'REQUEST_GET_WORKFLOW',
   GET_WORKFLOW_SUCCESS: 'GET_WORKFLOW_SUCCESS',
   GET_WORKFLOW_FAILURE: 'GET_WORKFLOW_FAILURE',

   REPLACE_TRANSITIONS: 'REPLACE_TRANSITIONS',
   REQUEST_REPLACE_TRANSITIONS: 'REQUEST_REPLACE_TRANSITIONS',
   REPLACE_TRANSITIONS_SUCCESS: 'REPLACE_TRANSITIONS_SUCCESS',
   REPLACE_TRANSITIONS_FAILURE: 'REPLACE_TRANSITIONS_FAILURE',
};
