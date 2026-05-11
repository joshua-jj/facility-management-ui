import React, { FC, useEffect, useState } from 'react';
import {
   WorkflowAppliesTo,
   WorkflowScopeRule,
   WorkflowTransition,
} from '@/types/workflow';

/**
 * Right-rail property panel for the workflow editor.
 *
 * Three modes:
 *  - `mode = 'metadata'` — nothing selected: shows subject / version /
 *    counts + add buttons.
 *  - `mode = 'state'` — a node is selected: rename + delete.
 *  - `mode = 'transition'` — an edge is selected: full transition form.
 *
 * The component is fully controlled — every change calls one of the
 * props callbacks. The parent owns the workflow state and decides
 * when to actually save (via `Save Changes` -> confirmation modal).
 */

export interface PropertyPanelProps {
   subject: string;
   version: number;
   states: string[];
   transitions: WorkflowTransition[];

   selectedStateIndex: number | null;
   selectedTransitionIndex: number | null;

   onAddState: (name: string) => void;
   onAddTransition: () => void;

   onRenameState: (index: number, newName: string) => void;
   onDeleteState: (index: number) => void;

   onUpdateTransition: (
      index: number,
      patch: Partial<WorkflowTransition>,
   ) => void;
   onDeleteTransition: (index: number) => void;

   isDirty: boolean;
   isSaving: boolean;
   onSave: () => void;
   onDiscard: () => void;
}

const SCOPE_OPTIONS: { value: WorkflowScopeRule; label: string }[] = [
   { value: 'any', label: 'any (no row filter)' },
   { value: 'own-dept', label: 'own-dept (HOD on department row)' },
   { value: 'self-assigned', label: 'self-assigned (assigned member only)' },
   {
      value: 'facility-bypass',
      label: 'facility-bypass (Facility department actors)',
   },
   { value: 'back-office', label: 'back-office (<subject>:manage holders)' },
];

const APPLIES_TO_OPTIONS: { value: WorkflowAppliesTo; label: string }[] = [
   { value: 'flat', label: 'flat (no parent, no children)' },
   { value: 'parent', label: 'parent (has children)' },
   { value: 'child', label: 'child (has a parent)' },
   { value: 'any', label: 'any kind of row' },
];

/** Common capability strings, surfaced as a quick-pick combobox. */
const COMMON_CAPABILITIES = [
   'requests:approve',
   'requests:decline',
   'requests:assign',
   'requests:release',
   'requests:return',
   'requests:manage',
   'complaints:assign',
   'complaints:resolve',
   'complaints:manage',
   'maintenance-logs:write',
   'maintenance-logs:manage',
   'generator-logs:write',
   'generator-logs:manage',
   'incidence-logs:write',
   'incidence-logs:manage',
];

const TransitionPropertyPanel: FC<PropertyPanelProps> = ({
   subject,
   version,
   states,
   transitions,
   selectedStateIndex,
   selectedTransitionIndex,
   onAddState,
   onAddTransition,
   onRenameState,
   onDeleteState,
   onUpdateTransition,
   onDeleteTransition,
   isDirty,
   isSaving,
   onSave,
   onDiscard,
}) => {
   const [addStateName, setAddStateName] = useState('');
   const [renameValue, setRenameValue] = useState('');

   const selectedTransition =
      selectedTransitionIndex != null
         ? transitions[selectedTransitionIndex]
         : null;
   const selectedState =
      selectedStateIndex != null ? states[selectedStateIndex] : null;

   useEffect(() => {
      // Sync rename input with the freshly-selected node.
      setRenameValue(selectedState ?? '');
   }, [selectedState]);

   const renderHeader = (title: string) => (
      <div className="border-b border-gray-100 px-4 py-3 bg-white rounded-t-xl">
         <h3 className="text-sm font-bold text-[#0F2552]">{title}</h3>
      </div>
   );

   const renderSaveBar = () => (
      <div className="px-4 py-3 border-t border-gray-100 bg-white rounded-b-xl flex gap-2 sticky bottom-0">
         <button
            onClick={onDiscard}
            disabled={!isDirty || isSaving}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[#0F2552] text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
         >
            Discard
         </button>
         <button
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="flex-1 px-3 py-2 rounded-lg bg-[#B28309] text-white text-xs font-semibold hover:bg-[#9a7208] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
         >
            {isSaving ? 'Saving…' : 'Save Changes'}
         </button>
      </div>
   );

   // ---------- Transition mode ----------
   if (selectedTransition && selectedTransitionIndex != null) {
      return (
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            {renderHeader('Transition')}
            <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
               <Field label="From State">
                  <select
                     value={selectedTransition.fromState}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           fromState: e.target.value,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  >
                     {states.map((s) => (
                        <option key={s} value={s}>
                           {s}
                        </option>
                     ))}
                  </select>
               </Field>

               <Field label="Action">
                  <input
                     type="text"
                     value={selectedTransition.action}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           action: e.target.value,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                     placeholder="e.g. approve"
                  />
               </Field>

               <Field label="To State">
                  <select
                     value={selectedTransition.toState}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           toState: e.target.value,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  >
                     {states.map((s) => (
                        <option key={s} value={s}>
                           {s}
                        </option>
                     ))}
                  </select>
               </Field>

               <Field label="Required Capability">
                  <input
                     type="text"
                     list="cap-options"
                     value={selectedTransition.requiredCapability}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           requiredCapability: e.target.value,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                     placeholder="e.g. requests:approve"
                  />
                  <datalist id="cap-options">
                     {COMMON_CAPABILITIES.map((c) => (
                        <option key={c} value={c} />
                     ))}
                  </datalist>
               </Field>

               <Field label="Scope Rule">
                  <select
                     value={selectedTransition.scopeRule}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           scopeRule: e.target.value as WorkflowScopeRule,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  >
                     {SCOPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                           {o.label}
                        </option>
                     ))}
                  </select>
               </Field>

               <Field label="Applies To">
                  <select
                     value={selectedTransition.appliesTo}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           appliesTo: e.target.value as WorkflowAppliesTo,
                        })
                     }
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  >
                     {APPLIES_TO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                           {o.label}
                        </option>
                     ))}
                  </select>
               </Field>

               <Field
                  label="Guard Expression"
                  hint="Reserved for a future DSL — ignored by the engine today."
               >
                  <textarea
                     value={selectedTransition.guardExpression ?? ''}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           guardExpression: e.target.value || null,
                        })
                     }
                     rows={3}
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309] resize-none"
                     placeholder="(optional)"
                  />
               </Field>

               <button
                  onClick={() => onDeleteTransition(selectedTransitionIndex)}
                  className="w-full mt-4 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 cursor-pointer"
               >
                  Delete Transition
               </button>
            </div>
            {renderSaveBar()}
         </div>
      );
   }

   // ---------- State mode ----------
   if (selectedState != null && selectedStateIndex != null) {
      const outCount = transitions.filter(
         (t) => t.fromState === selectedState,
      ).length;
      const inCount = transitions.filter(
         (t) => t.toState === selectedState,
      ).length;
      return (
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            {renderHeader('State')}
            <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
               <Field label="Name">
                  <input
                     type="text"
                     value={renameValue}
                     onChange={(e) => setRenameValue(e.target.value)}
                     onBlur={() => {
                        const trimmed = renameValue.trim();
                        if (trimmed && trimmed !== selectedState) {
                           onRenameState(selectedStateIndex, trimmed);
                        } else if (!trimmed) {
                           setRenameValue(selectedState);
                        }
                     }}
                     className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  />
                  <p className="text-[0.65rem] text-gray-400 mt-1">
                     Renaming updates every transition row that references this
                     state.
                  </p>
               </Field>

               <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#0F2552]/80 space-y-1">
                  <div>
                     <strong>{outCount}</strong> outgoing transitions
                  </div>
                  <div>
                     <strong>{inCount}</strong> incoming transitions
                  </div>
               </div>

               <button
                  onClick={() => {
                     if (outCount > 0 || inCount > 0) {
                        const ok = window.confirm(
                           `Delete state '${selectedState}'? ${outCount + inCount} transitions reference it; ` +
                              'they will be removed too.',
                        );
                        if (!ok) return;
                     }
                     onDeleteState(selectedStateIndex);
                  }}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 cursor-pointer"
               >
                  Delete State
               </button>
            </div>
            {renderSaveBar()}
         </div>
      );
   }

   // ---------- Metadata mode (nothing selected) ----------
   return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
         {renderHeader('Workflow')}
         <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
            <div className="space-y-2">
               <Stat label="Subject" value={subject} />
               <Stat label="Current Version" value={`v${version}`} />
               <Stat label="States" value={String(states.length)} />
               <Stat label="Transitions" value={String(transitions.length)} />
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2">
               <p className="text-[0.65rem] uppercase font-bold text-gray-400 tracking-wider">
                  Add
               </p>
               <div className="flex gap-2">
                  <input
                     type="text"
                     value={addStateName}
                     onChange={(e) => setAddStateName(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           const trimmed = addStateName.trim();
                           if (trimmed) {
                              onAddState(trimmed);
                              setAddStateName('');
                           }
                        }
                     }}
                     placeholder="New state name…"
                     className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#0F2552] focus:outline-none focus:border-[#B28309]"
                  />
                  <button
                     onClick={() => {
                        const trimmed = addStateName.trim();
                        if (trimmed) {
                           onAddState(trimmed);
                           setAddStateName('');
                        }
                     }}
                     className="px-3 py-2 rounded-lg bg-[#B28309] text-white text-xs font-semibold hover:bg-[#9a7208] cursor-pointer"
                  >
                     + State
                  </button>
               </div>
               <button
                  onClick={onAddTransition}
                  disabled={states.length < 1}
                  className="w-full px-3 py-2 rounded-lg border border-[#B28309] text-[#B28309] text-xs font-semibold hover:bg-[#B28309]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
               >
                  + Add Transition
               </button>
            </div>

            <div className="pt-2 border-t border-gray-100">
               <p className="text-[0.65rem] text-gray-400 leading-relaxed">
                  Click a state or transition in the canvas to edit it.
                  Saving creates version v{version + 1}; in-flight rows
                  continue using v{version}.
               </p>
            </div>
         </div>
         {renderSaveBar()}
      </div>
   );
};

const Field: FC<{
   label: string;
   hint?: string;
   children: React.ReactNode;
}> = ({ label, hint, children }) => (
   <div>
      <label className="block text-[0.65rem] uppercase tracking-wider font-bold text-gray-400 mb-1">
         {label}
      </label>
      {children}
      {hint && (
         <p className="text-[0.6rem] text-gray-400 mt-1 leading-snug">{hint}</p>
      )}
   </div>
);

const Stat: FC<{ label: string; value: string }> = ({ label, value }) => (
   <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-[#0F2552]">{value}</span>
   </div>
);

export default TransitionPropertyPanel;
