/**
 * Wire types for the Workflow Rules Module admin endpoints.
 *
 * Mirrors the API DTOs:
 *  - `WorkflowSummary` is what GET /workflow returns per subject.
 *  - `WorkflowDefinition` + `WorkflowTransition` are what GET
 *    /workflow/:subject returns under `data`.
 *  - `WorkflowReplaceBody` is the PUT /workflow/:subject/transitions
 *    payload — `transitions[]` is the new set, `states[]` optional.
 *
 * Kept in a `.d.ts` so the types are ambient and the UI code doesn't
 * pay the runtime cost of re-exporting them through a barrel.
 */

export type WorkflowScopeRule =
   | 'any'
   | 'own-dept'
   | 'self-assigned'
   | 'facility-bypass'
   | 'back-office';

export type WorkflowAppliesTo = 'flat' | 'parent' | 'child' | 'any';

export interface WorkflowSummary {
   subject: string;
   version: number;
   description: string | null;
   statesCount: number;
   transitionCount: number;
   updatedAt: string;
}

export interface WorkflowTransition {
   id?: number;
   workflowId?: number;
   fromState: string;
   action: string;
   toState: string;
   requiredCapability: string;
   scopeRule: WorkflowScopeRule;
   appliesTo: WorkflowAppliesTo;
   guardExpression?: string | null;
}

export interface WorkflowDefinition {
   id: number;
   subject: string;
   version: number;
   states: string[];
   description: string | null;
   createdAt?: string;
   updatedAt?: string;
}

export interface WorkflowDetail {
   definition: WorkflowDefinition;
   transitions: WorkflowTransition[];
}

/**
 * Wire payload for `PUT /workflow/:subject/transitions`. Mirrors the
 * `ReplaceTransitionsDto` on the API side. `guardExpression` is
 * accepted but currently ignored by the engine.
 */
export interface WorkflowReplaceBody {
   transitions: WorkflowTransition[];
   states?: string[];
}
