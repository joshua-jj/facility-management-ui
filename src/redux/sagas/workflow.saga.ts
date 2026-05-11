import { put, takeLatest, all } from 'typed-redux-saga';
import { workflowConstants } from '@/constants/workflow.constant';
import { authenticatedRequest, handleSagaError } from '@/utilities/saga-helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';
import {
   GetWorkflowAction,
   ReplaceTransitionsAction,
} from '@/actions/workflow.actions';

/**
 * Workflow admin sagas — list / get / replace. All three call into
 * `/workflow*` on the API; the saga layer just translates payloads and
 * dispatches the success / failure events.
 */

function* listWorkflows() {
   yield put({ type: workflowConstants.REQUEST_GET_WORKFLOWS });
   try {
      const json = yield* authenticatedRequest(workflowConstants.WORKFLOW_URI, {
         method: 'GET',
      });
      if (!json) return;
      const items = (json?.data as unknown[]) ?? [];
      yield put({
         type: workflowConstants.GET_WORKFLOWS_SUCCESS,
         workflows: items,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         workflowConstants.GET_WORKFLOWS_FAILURE,
         false,
      );
   }
}

function* getWorkflow({ subject }: GetWorkflowAction) {
   yield put({ type: workflowConstants.REQUEST_GET_WORKFLOW });
   try {
      const uri = `${workflowConstants.WORKFLOW_URI}/${encodeURIComponent(subject)}`;
      const json = yield* authenticatedRequest(uri, { method: 'GET' });
      if (!json) return;
      yield put({
         type: workflowConstants.GET_WORKFLOW_SUCCESS,
         workflow: json?.data,
      });
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         workflowConstants.GET_WORKFLOW_FAILURE,
         false,
      );
   }
}

function* replaceTransitions({ subject, body }: ReplaceTransitionsAction) {
   yield put({ type: workflowConstants.REQUEST_REPLACE_TRANSITIONS });
   try {
      const uri = `${workflowConstants.WORKFLOW_URI}/${encodeURIComponent(subject)}/transitions`;
      const json = yield* authenticatedRequest(uri, {
         method: 'PUT',
         body: JSON.stringify(body),
      });
      if (!json) return;

      yield put({
         type: workflowConstants.REPLACE_TRANSITIONS_SUCCESS,
         summary: json?.data,
      });

      // Refresh the detail view after a successful save — the page
      // reads `workflow.current` to render the canvas + property
      // panel, and the new version's transition rows are what we want
      // to show.
      yield put({
         type: workflowConstants.GET_WORKFLOW,
         subject,
      });

      const payload: SetSnackBarPayload = {
         type: 'success',
         message:
            (json?.message as string) ?? 'Workflow updated successfully',
         variant: 'success',
      };
      yield put(appActions.setSnackBar(payload));
   } catch (error: unknown) {
      yield* handleSagaError(
         error,
         workflowConstants.REPLACE_TRANSITIONS_FAILURE,
      );
   }
}

function* listWorkflowsWatcher() {
   yield takeLatest(workflowConstants.GET_WORKFLOWS, listWorkflows);
}

function* getWorkflowWatcher() {
   yield takeLatest(workflowConstants.GET_WORKFLOW, getWorkflow);
}

function* replaceTransitionsWatcher() {
   yield takeLatest(
      workflowConstants.REPLACE_TRANSITIONS,
      replaceTransitions,
   );
}

export default function* rootSaga() {
   yield all([
      listWorkflowsWatcher(),
      getWorkflowWatcher(),
      replaceTransitionsWatcher(),
   ]);
}
