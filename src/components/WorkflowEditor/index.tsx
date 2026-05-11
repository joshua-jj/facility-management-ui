import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
   Background,
   BackgroundVariant,
   Controls,
   Edge,
   EdgeMouseHandler,
   MarkerType,
   MiniMap,
   Node,
   NodeMouseHandler,
   ReactFlow,
   ReactFlowProvider,
} from '@xyflow/react';

// React Flow base styles are loaded once from `src/pages/_app.tsx` —
// Next.js Pages Router blocks node_modules CSS imports from anywhere
// else. Skin overrides + brand theming live in Tailwind classes
// applied directly to the component tree.

import {
   WorkflowDefinition,
   WorkflowTransition,
} from '@/types/workflow';
import StateNode from './StateNode';
import TransitionEdge from './TransitionEdge';
import TransitionPropertyPanel from './TransitionPropertyPanel';

/**
 * Top-level workflow editor. Reads the loaded workflow detail from
 * props, lays it out on a react-flow canvas, and forwards edits to a
 * `onSave` callback that the page wires to the
 * `replaceTransitions` saga.
 *
 * Layout: hand-placed columns by state index. Good enough for ~10
 * states; if a workflow ever exceeds that, swap in `dagre` (already a
 * react-flow community recipe). Avoiding dagre for now keeps the
 * dependency surface tight.
 */
export interface WorkflowEditorProps {
   definition: WorkflowDefinition;
   transitions: WorkflowTransition[];
   isSaving: boolean;
   onSave: (next: {
      states: string[];
      transitions: WorkflowTransition[];
   }) => void;
}

const nodeTypes = { state: StateNode } as const;
const edgeTypes = { transition: TransitionEdge } as const;

/**
 * Stable position for one state. Lay out in a grid of 3 columns,
 * stepping by 220px horizontally and 130px vertically — that puts a
 * 9-state workflow on a single screen at the default zoom.
 */
const positionFor = (index: number) => ({
   x: 60 + (index % 3) * 240,
   y: 40 + Math.floor(index / 3) * 150,
});

const buildNodes = (
   states: string[],
   transitions: WorkflowTransition[],
   selectedStateIndex: number | null,
): Node[] =>
   states.map((name, i) => ({
      id: `state-${i}`,
      type: 'state',
      position: positionFor(i),
      data: {
         label: name,
         transitionCount: transitions.filter((t) => t.fromState === name).length,
      },
      selected: selectedStateIndex === i,
   }));

const buildEdges = (
   transitions: WorkflowTransition[],
   states: string[],
   selectedTransitionIndex: number | null,
): Edge[] =>
   transitions
      .map((t, i) => {
         const fromIdx = states.indexOf(t.fromState);
         const toIdx = states.indexOf(t.toState);
         if (fromIdx === -1 || toIdx === -1) return null;
         return {
            id: `t-${i}`,
            source: `state-${fromIdx}`,
            target: `state-${toIdx}`,
            type: 'transition',
            data: {
               action: t.action,
               requiredCapability: t.requiredCapability,
               appliesTo: t.appliesTo,
               scopeRule: t.scopeRule,
            },
            selected: selectedTransitionIndex === i,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
         } as Edge;
      })
      .filter((e): e is Edge => e != null);

const WorkflowEditorInner: FC<WorkflowEditorProps> = ({
   definition,
   transitions: initialTransitions,
   isSaving,
   onSave,
}) => {
   const [states, setStates] = useState<string[]>(definition.states ?? []);
   const [transitions, setTransitions] = useState<WorkflowTransition[]>(
      initialTransitions ?? [],
   );
   const [selectedStateIndex, setSelectedStateIndex] = useState<number | null>(
      null,
   );
   const [selectedTransitionIndex, setSelectedTransitionIndex] = useState<
      number | null
   >(null);
   const [validationError, setValidationError] = useState<string | null>(null);
   const [confirmOpen, setConfirmOpen] = useState(false);

   // Snapshot of the loaded data — used to detect "dirty" state and to
   // power Discard.
   const baseline = useMemo(
      () => ({
         states: definition.states ?? [],
         transitions: initialTransitions ?? [],
      }),
      [definition.states, initialTransitions],
   );

   useEffect(() => {
      setStates(baseline.states);
      setTransitions(baseline.transitions);
      setSelectedStateIndex(null);
      setSelectedTransitionIndex(null);
   }, [baseline]);

   const isDirty = useMemo(() => {
      if (states.join('|') !== baseline.states.join('|')) return true;
      if (transitions.length !== baseline.transitions.length) return true;
      return transitions.some((t, i) => {
         const b = baseline.transitions[i];
         if (!b) return true;
         return (
            t.fromState !== b.fromState ||
            t.action !== b.action ||
            t.toState !== b.toState ||
            t.requiredCapability !== b.requiredCapability ||
            t.scopeRule !== b.scopeRule ||
            t.appliesTo !== b.appliesTo ||
            (t.guardExpression ?? null) !== (b.guardExpression ?? null)
         );
      });
   }, [states, transitions, baseline]);

   const nodes = useMemo(
      () => buildNodes(states, transitions, selectedStateIndex),
      [states, transitions, selectedStateIndex],
   );
   const edges = useMemo(
      () => buildEdges(transitions, states, selectedTransitionIndex),
      [transitions, states, selectedTransitionIndex],
   );

   // ---------- Selection wiring ----------

   const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
      const idx = Number(node.id.replace('state-', ''));
      setSelectedStateIndex(Number.isFinite(idx) ? idx : null);
      setSelectedTransitionIndex(null);
   }, []);

   const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
      const idx = Number(edge.id.replace('t-', ''));
      setSelectedTransitionIndex(Number.isFinite(idx) ? idx : null);
      setSelectedStateIndex(null);
   }, []);

   const onPaneClick = useCallback(() => {
      setSelectedStateIndex(null);
      setSelectedTransitionIndex(null);
   }, []);

   // ---------- Mutation handlers ----------

   const handleAddState = useCallback(
      (name: string) => {
         setValidationError(null);
         if (states.includes(name)) {
            setValidationError(`State '${name}' already exists`);
            return;
         }
         setStates((prev) => [...prev, name]);
      },
      [states],
   );

   const handleAddTransition = useCallback(() => {
      if (states.length === 0) return;
      const first = states[0];
      setTransitions((prev) => [
         ...prev,
         {
            fromState: first,
            action: 'new-action',
            toState: states[Math.min(states.length - 1, 1)] ?? first,
            requiredCapability: '',
            scopeRule: 'any',
            appliesTo: 'flat',
            guardExpression: null,
         },
      ]);
      setSelectedTransitionIndex(transitions.length);
      setSelectedStateIndex(null);
   }, [states, transitions.length]);

   const handleRenameState = useCallback(
      (index: number, newName: string) => {
         setValidationError(null);
         if (states.includes(newName)) {
            setValidationError(`State '${newName}' already exists`);
            return;
         }
         const oldName = states[index];
         setStates((prev) => prev.map((s, i) => (i === index ? newName : s)));
         setTransitions((prev) =>
            prev.map((t) => ({
               ...t,
               fromState: t.fromState === oldName ? newName : t.fromState,
               toState: t.toState === oldName ? newName : t.toState,
            })),
         );
      },
      [states],
   );

   const handleDeleteState = useCallback(
      (index: number) => {
         const oldName = states[index];
         setStates((prev) => prev.filter((_, i) => i !== index));
         setTransitions((prev) =>
            prev.filter(
               (t) => t.fromState !== oldName && t.toState !== oldName,
            ),
         );
         setSelectedStateIndex(null);
      },
      [states],
   );

   const handleUpdateTransition = useCallback(
      (index: number, patch: Partial<WorkflowTransition>) => {
         setValidationError(null);
         setTransitions((prev) =>
            prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
         );
      },
      [],
   );

   const handleDeleteTransition = useCallback((index: number) => {
      setTransitions((prev) => prev.filter((_, i) => i !== index));
      setSelectedTransitionIndex(null);
   }, []);

   // ---------- Save / discard ----------

   const validate = (): string | null => {
      const stateSet = new Set(states);
      for (const [i, t] of transitions.entries()) {
         if (!stateSet.has(t.fromState)) {
            return `Transition #${i + 1}: fromState '${t.fromState}' is not in the workflow's states.`;
         }
         if (!stateSet.has(t.toState)) {
            return `Transition #${i + 1}: toState '${t.toState}' is not in the workflow's states.`;
         }
         if (!t.action?.trim()) {
            return `Transition #${i + 1}: action is required.`;
         }
         if (!t.requiredCapability?.trim()) {
            return `Transition #${i + 1}: required capability is required.`;
         }
      }
      // Duplicate identity quadruple check — matches the API validator.
      const seen = new Map<string, number>();
      for (const [i, t] of transitions.entries()) {
         const key = `${t.fromState}::${t.action}::${t.toState}::${t.appliesTo}`;
         if (seen.has(key)) {
            return `Transition #${i + 1} duplicates transition #${(seen.get(key) ?? 0) + 1}: ` +
               `(${t.fromState}, ${t.action}, ${t.toState}, ${t.appliesTo}) — each quadruple must be unique.`;
         }
         seen.set(key, i);
      }
      // Action uniqueness within (fromState, appliesTo) — enforces
      // the plan's UI-side rule.
      const fromActionSeen = new Map<string, number>();
      for (const [i, t] of transitions.entries()) {
         const key = `${t.fromState}::${t.action}::${t.appliesTo}`;
         if (fromActionSeen.has(key)) {
            return `Transition #${i + 1}: action '${t.action}' is already defined for fromState '${t.fromState}' / appliesTo '${t.appliesTo}'.`;
         }
         fromActionSeen.set(key, i);
      }
      return null;
   };

   const handleSaveClick = useCallback(() => {
      const err = validate();
      if (err) {
         setValidationError(err);
         return;
      }
      setValidationError(null);
      setConfirmOpen(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [states, transitions]);

   const handleConfirmSave = useCallback(() => {
      setConfirmOpen(false);
      onSave({ states, transitions });
   }, [states, transitions, onSave]);

   const handleDiscard = useCallback(() => {
      setStates(baseline.states);
      setTransitions(baseline.transitions);
      setSelectedStateIndex(null);
      setSelectedTransitionIndex(null);
      setValidationError(null);
   }, [baseline]);

   return (
      <div className="flex flex-col gap-4 h-[calc(100vh-220px)] min-h-[600px]">
         {validationError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
               {validationError}
            </div>
         )}

         <div className="flex gap-4 flex-1 min-h-0">
            <div
               className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative"
               style={{ minHeight: 500 }}
            >
               <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onPaneClick={onPaneClick}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable
                  nodesConnectable={false}
                  elementsSelectable
               >
                  <Background
                     variant={BackgroundVariant.Dots}
                     gap={20}
                     size={1}
                     color="#e5e7eb"
                  />
                  <Controls
                     position="bottom-left"
                     showInteractive={false}
                     style={{ background: 'white' }}
                  />
                  <MiniMap
                     pannable
                     zoomable
                     maskColor="rgba(178, 131, 9, 0.06)"
                     nodeColor={() => '#B28309'}
                     style={{
                        background: 'white',
                        border: '1px solid #f3f4f6',
                     }}
                  />
               </ReactFlow>
            </div>

            <div className="w-[360px] shrink-0 min-h-0">
               <TransitionPropertyPanel
                  subject={definition.subject}
                  version={definition.version}
                  states={states}
                  transitions={transitions}
                  selectedStateIndex={selectedStateIndex}
                  selectedTransitionIndex={selectedTransitionIndex}
                  onAddState={handleAddState}
                  onAddTransition={handleAddTransition}
                  onRenameState={handleRenameState}
                  onDeleteState={handleDeleteState}
                  onUpdateTransition={handleUpdateTransition}
                  onDeleteTransition={handleDeleteTransition}
                  isDirty={isDirty}
                  isSaving={isSaving}
                  onSave={handleSaveClick}
                  onDiscard={handleDiscard}
               />
            </div>
         </div>

         {confirmOpen && (
            <div
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
               role="dialog"
            >
               <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                  <h3 className="text-lg font-bold text-[#0F2552]">
                     Confirm workflow update
                  </h3>
                  <p className="text-sm text-[#0F2552]/80 leading-relaxed">
                     This will create version{' '}
                     <strong>v{definition.version + 1}</strong> of the{' '}
                     <strong>{definition.subject}</strong> workflow. In-flight{' '}
                     {definition.subject} will continue using v
                     {definition.version}; only newly-created rows pick up the
                     new rules.
                  </p>
                  <div className="flex gap-2 justify-end pt-2">
                     <button
                        onClick={() => setConfirmOpen(false)}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-[#0F2552] text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={handleConfirmSave}
                        className="px-4 py-2 rounded-lg bg-[#B28309] text-white text-sm font-semibold hover:bg-[#9a7208] cursor-pointer"
                     >
                        Save v{definition.version + 1}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const WorkflowEditor: FC<WorkflowEditorProps> = (props) => (
   <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
   </ReactFlowProvider>
);

export default WorkflowEditor;
