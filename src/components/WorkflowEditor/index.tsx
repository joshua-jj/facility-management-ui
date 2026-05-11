import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
   Background,
   BackgroundVariant,
   Connection,
   Controls,
   Edge,
   EdgeMouseHandler,
   MarkerType,
   MiniMap,
   Node,
   NodeChange,
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
   nodePositions: Record<string, { x: number; y: number }>,
): Node[] =>
   states.map((name, i) => ({
      id: `state-${i}`,
      type: 'state',
      // Prefer the dragged-and-dropped position if the user has moved
      // this node; fall back to the static grid for new states.
      position: nodePositions[name] ?? positionFor(i),
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
         // Self-loop: anchor source to the right handle (default) and
         // target to the top handle so the bezier arcs over the node
         // instead of collapsing through its center. Without this the
         // label lands on top of the state and reads as overlap.
         const isSelfLoop = fromIdx === toIdx;
         return {
            id: `t-${i}`,
            source: `state-${fromIdx}`,
            target: `state-${toIdx}`,
            ...(isSelfLoop ? { targetHandle: 'target-top' } : {}),
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

   // Per-state position overrides applied when the user drags a node.
   // Keyed by state name so that renaming a state migrates the position
   // along with the identity. Cleared on Discard via the `baseline` effect.
   const [nodePositions, setNodePositions] = useState<
      Record<string, { x: number; y: number }>
   >({});

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
      setNodePositions({});
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
      () => buildNodes(states, transitions, selectedStateIndex, nodePositions),
      [states, transitions, selectedStateIndex, nodePositions],
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

   // ---------- Node drag wiring ----------

   /**
    * React Flow batches every interactive change (drag, select, dimension
    * report) through `onNodesChange`. We care about position changes
    * only — and only the final settled position once the user drops the
    * node. Persisting on every frame would re-render the whole canvas
    * for the duration of the drag; persisting on drop keeps the gesture
    * smooth (RF owns the visual position internally during the drag).
    */
   const onNodesChange = useCallback(
      (changes: NodeChange[]) => {
         const updates: Record<string, { x: number; y: number }> = {};
         for (const change of changes) {
            if (change.type !== 'position') continue;
            if (change.dragging) continue; // only persist on drag-end
            if (!change.position) continue;
            const idx = Number(change.id.replace('state-', ''));
            const name = states[idx];
            if (!name) continue;
            updates[name] = change.position;
         }
         if (Object.keys(updates).length === 0) return;
         setNodePositions((prev) => ({ ...prev, ...updates }));
      },
      [states],
   );

   /**
    * Drag from one node's source handle to another node's target handle
    * to create a transition. The new row goes in with empty action /
    * capability so the user is forced to fill them in via the property
    * panel — the validator on save will catch anything they leave blank.
    */
   const onConnect = useCallback(
      (conn: Connection) => {
         if (!conn.source || !conn.target) return;
         const fromIdx = Number(conn.source.replace('state-', ''));
         const toIdx = Number(conn.target.replace('state-', ''));
         const fromState = states[fromIdx];
         const toState = states[toIdx];
         if (!fromState || !toState) return;
         setTransitions((prev) => {
            const next: WorkflowTransition[] = [
               ...prev,
               {
                  fromState,
                  action: 'new-action',
                  toState,
                  requiredCapability: '',
                  scopeRule: 'any',
                  appliesTo: 'flat',
                  guardExpression: null,
               },
            ];
            // Open the property panel on the freshly-created transition.
            setSelectedTransitionIndex(next.length - 1);
            setSelectedStateIndex(null);
            return next;
         });
      },
      [states],
   );

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
         // Carry the dragged position over to the renamed key so the
         // node doesn't snap back to the grid after a rename.
         setNodePositions((prev) => {
            if (!prev[oldName]) return prev;
            const next = { ...prev };
            next[newName] = next[oldName];
            delete next[oldName];
            return next;
         });
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
         setNodePositions((prev) => {
            if (!prev[oldName]) return prev;
            const next = { ...prev };
            delete next[oldName];
            return next;
         });
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
      <div className="flex flex-col gap-4 h-[calc(100vh-280px)] min-h-[480px]">
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
                  onNodesChange={onNodesChange}
                  onConnect={onConnect}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable
                  nodesConnectable
                  elementsSelectable
               >
                  <Background
                     variant={BackgroundVariant.Dots}
                     gap={20}
                     size={1}
                     color="#e5e7eb"
                  />
                  {/* React Flow's default Controls inherit `currentColor`
                      for their SVG icons. In dark mode the app's global
                      text colour is light, so `currentColor` resolves to
                      near-white and the zoom icons disappear against the
                      white button background. Pin the button colour
                      explicitly so the icons remain visible regardless
                      of the parent text colour. */}
                  <Controls
                     position="bottom-left"
                     showInteractive={false}
                     className="[&_button]:!bg-white [&_button]:!border-gray-200 [&_button]:!text-[#0F2552] [&_button:hover]:!bg-gray-50 [&_button>svg]:!fill-current"
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
