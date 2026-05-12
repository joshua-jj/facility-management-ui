import React, {
   FC,
   useCallback,
   useEffect,
   useRef,
   useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
   WorkflowAppliesTo,
   WorkflowScopeRule,
   WorkflowTransition,
} from '@/types/workflow';

/**
 * Shared input/select chrome. Single source of truth for the panel's
 * field treatment — change once, every field updates.
 *
 * Native `<select>` ships with OS-default chrome that doesn't match the
 * rounded gold-accent look used everywhere else in the admin UI, so we
 * strip it via `appearance-none` and render our own chevron in the
 * `StyledSelect` helper below.
 */
const FIELD_BASE =
   'w-full text-sm text-[#0F2552] bg-white rounded-lg transition-colors focus:outline-none';

const FIELD_BORDER_OK =
   'border border-gray-200 hover:border-gray-300 focus:border-[#B28309] focus:ring-2 focus:ring-[#B28309]/20';

const FIELD_BORDER_ERR =
   'border border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const INPUT_CLASS = `${FIELD_BASE} px-3 py-2 ${FIELD_BORDER_OK}`;
const INPUT_CLASS_ERROR = `${FIELD_BASE} px-3 py-2 ${FIELD_BORDER_ERR}`;

/**
 * Gold-tinted chevron rendered to the right of every select. SVG sits
 * inside the wrapper so it inherits the wrapper's `text-` colour, which
 * lets us tint it differently per state (active vs disabled etc.) if
 * needed later.
 */
const CHEVRON_ICON = (
   <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
   >
      <path d="M5.5 7.5 10 12l4.5-4.5" />
   </svg>
);

/**
 * Custom popover dropdown. The native `<option>` list is rendered by
 * the OS / browser and cannot be styled — on dark-mode browsers it
 * appears as a dark popup with light text that clashes with the panel's
 * white surface. Replacing the native `<select>` with a portaled
 * popover gives us full control over both the closed trigger and the
 * open option list.
 *
 * Pattern mirrors `ActionMenu` — `createPortal` to body so the popover
 * escapes the panel's `overflow-y-auto` container, plus click-outside +
 * Esc to close.
 */
type SelectOption = { value: string; label: string };

const CHECK_ICON = (
   <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
   >
      <path d="M5 13l4 4L19 7" />
   </svg>
);

const StyledSelect: FC<{
   value: string;
   options: SelectOption[];
   onChange: (next: string) => void;
   ariaLabel?: string;
}> = ({ value, options, onChange, ariaLabel }) => {
   const [open, setOpen] = useState(false);
   const [position, setPosition] = useState<{
      top?: number;
      bottom?: number;
      left: number;
      width: number;
   }>({ left: 0, width: 0 });
   const triggerRef = useRef<HTMLButtonElement>(null);
   const popoverRef = useRef<HTMLDivElement>(null);
   const [isClient, setIsClient] = useState(false);

   useEffect(() => setIsClient(true), []);

   const selected = options.find((o) => o.value === value);

   const toggle = useCallback(() => {
      if (!open && triggerRef.current) {
         const rect = triggerRef.current.getBoundingClientRect();
         const spaceBelow = window.innerHeight - rect.bottom;
         // Approx menu height: 38px per option + 8px py + a cap.
         const menuHeight = Math.min(options.length * 38 + 8, 288);
         const pos: typeof position = {
            left: rect.left,
            width: rect.width,
         };
         if (spaceBelow < menuHeight && rect.top > menuHeight) {
            pos.bottom = window.innerHeight - rect.top + 4;
         } else {
            pos.top = rect.bottom + 4;
         }
         setPosition(pos);
      }
      setOpen((p) => !p);
   }, [open, options.length]);

   // Close on outside click — same pattern as ActionMenu.
   useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
         if (
            popoverRef.current &&
            !popoverRef.current.contains(e.target as Node) &&
            triggerRef.current &&
            !triggerRef.current.contains(e.target as Node)
         ) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, [open]);

   // Close on Escape.
   useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
   }, [open]);

   // Close on scroll — the trigger moves; the popover would float in
   // the wrong place otherwise. Close-rather-than-reposition keeps the
   // implementation tight and matches what the native select does.
   useEffect(() => {
      if (!open) return;
      const handler = () => setOpen(false);
      window.addEventListener('scroll', handler, true);
      return () => window.removeEventListener('scroll', handler, true);
   }, [open]);

   const popover = (
      <div
         ref={popoverRef}
         role="listbox"
         style={{
            position: 'fixed',
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            width: position.width,
            zIndex: 9999,
         }}
         className="bg-white rounded-lg border border-gray-200 shadow-lg py-1 max-h-72 overflow-auto"
      >
         {options.map((o) => {
            const isSelected = o.value === value;
            return (
               <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                     onChange(o.value);
                     setOpen(false);
                  }}
                  className={[
                     'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer',
                     isSelected
                        ? 'bg-[#B28309]/10 text-[#B28309] font-semibold'
                        : 'text-[#0F2552] hover:bg-gray-50',
                  ].join(' ')}
               >
                  <span className="w-3 h-3 flex items-center justify-center shrink-0">
                     {isSelected ? CHECK_ICON : null}
                  </span>
                  <span className="flex-1">{o.label}</span>
               </button>
            );
         })}
      </div>
   );

   return (
      <>
         <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel}
            className={`${FIELD_BASE} pl-3 pr-9 py-2 text-left cursor-pointer relative ${
               open
                  ? 'border border-[#B28309] ring-2 ring-[#B28309]/20'
                  : FIELD_BORDER_OK
            }`}
         >
            <span className={selected ? '' : 'text-gray-400'}>
               {selected?.label ?? 'Select…'}
            </span>
            <span
               className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${
                  open ? 'rotate-180' : ''
               }`}
            >
               {CHEVRON_ICON}
            </span>
         </button>
         {open && isClient && createPortal(popover, document.body)}
      </>
   );
};

/**
 * Help tooltip — the small `i`/`?` icon admins hover for a longer
 * explanation of a field. The trigger is a tabbable span (focusable
 * for keyboard users); the tooltip body is portaled to body so it
 * isn't clipped by the panel's `overflow-y-auto`.
 *
 * Positioning: the panel sits on the right rail, so by default the
 * tooltip opens to the LEFT of the icon (where the canvas is). If
 * there isn't enough room (e.g. narrow viewport), it falls back to the
 * right edge of the icon.
 */
const InfoTooltip: FC<{
   body: string;
   example?: string;
}> = ({ body, example }) => {
   const [open, setOpen] = useState(false);
   const [position, setPosition] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
   });
   const triggerRef = useRef<HTMLSpanElement>(null);
   const [isClient, setIsClient] = useState(false);
   useEffect(() => setIsClient(true), []);

   const TOOLTIP_WIDTH = 260;
   const VIEWPORT_GUTTER = 8;

   const show = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      // Try left-side placement first (since panel hugs the right edge).
      const leftSide = rect.left - TOOLTIP_WIDTH - 8;
      const left =
         leftSide >= VIEWPORT_GUTTER
            ? leftSide
            : Math.min(
                 rect.right + 8,
                 window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_GUTTER,
              );
      setPosition({ top: rect.top - 4, left });
      setOpen(true);
   }, []);
   const hide = useCallback(() => setOpen(false), []);

   const tooltip = (
      <div
         role="tooltip"
         style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: TOOLTIP_WIDTH,
            zIndex: 9999,
         }}
         className="bg-[#0F2552] text-white rounded-lg shadow-xl p-3 animate-fade-in"
      >
         <div className="text-[0.7rem] leading-snug">{body}</div>
         {example && (
            <div className="text-[0.65rem] mt-2 pt-2 border-t border-white/15 text-white/75 leading-snug">
               <span className="font-bold uppercase tracking-wider text-white/50 mr-1">
                  Example
               </span>
               {example}
            </div>
         )}
      </div>
   );

   return (
      <>
         <span
            ref={triggerRef}
            tabIndex={0}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[0.55rem] font-bold bg-gray-200 text-gray-500 hover:bg-[#B28309] hover:text-white focus:bg-[#B28309] focus:text-white outline-none transition-colors cursor-help align-middle"
            aria-label="Help"
         >
            ?
         </span>
         {open && isClient && createPortal(tooltip, document.body)}
      </>
   );
};

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

/**
 * Scope rule = "which rows can the actor fire this action on?"
 *
 * The label is what the dropdown shows when collapsed; the hint is the
 * one-sentence plain-English condition that surfaces under the select
 * once the value is chosen. Source of truth for behaviour:
 * `workflow.engine.ts#scopeApplies`.
 */
const SCOPE_OPTIONS: {
   value: WorkflowScopeRule;
   label: string;
   hint: string;
}[] = [
   {
      value: 'any',
      label: 'Anyone with the capability',
      hint: 'No extra filter. If the actor holds the required capability above, they pass this rule.',
   },
   {
      value: 'own-dept',
      label: 'Only the row’s department',
      hint: 'Actor passes only if their department matches the request/complaint’s fulfilling department. Used for HOD approvals.',
   },
   {
      value: 'self-assigned',
      label: 'Only the assignee',
      hint: 'Actor passes only if they are the person currently assigned to this row. Used for member release/return/resolve.',
   },
   {
      value: 'facility-bypass',
      label: 'Only Facility department actors',
      hint: 'Actor passes only if their department name is exactly “Facility”. Lets the Facility team act on rows outside the usual dept boundaries.',
   },
   {
      value: 'back-office',
      label: 'Only back-office (“manage” holders)',
      hint: 'Actor passes only if they hold the <subject>:manage capability — e.g. complaints:manage for the complaints workflow.',
   },
];

/**
 * Applies-to = "which rows does this rule SHAPE apply to?"
 *
 * A request can be a single flat row, a parent (split across depts) or
 * a child (one dept’s slice of a parent). Source of truth:
 * `workflow.engine.ts#matchesAppliesTo`.
 */
const APPLIES_TO_OPTIONS: {
   value: WorkflowAppliesTo;
   label: string;
   hint: string;
}[] = [
   {
      value: 'flat',
      label: 'Single rows only',
      hint: 'Rule fires only on rows with no parent and no children — the simple, single-department case.',
   },
   {
      value: 'parent',
      label: 'Parent rows only',
      hint: 'Rule fires only on the top-level row of a multi-department request. Acting on the parent rolls children up.',
   },
   {
      value: 'child',
      label: 'Child rows only',
      hint: 'Rule fires only on a child row — one department’s slice of a multi-department parent.',
   },
   {
      value: 'any',
      label: 'Any row shape',
      hint: 'Rule fires regardless of whether the row is flat, a parent, or a child.',
   },
];

/**
 * Action format: lowercase letters, digits, hyphens. No spaces, no colons.
 * Matches the `verb` shape the engine expects on the wire.
 */
const ACTION_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Required-capability format: `subject:action`. Both halves use the
 * same letters/digits/hyphens shape.
 */
const CAPABILITY_PATTERN = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

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
      // Per-field inline validation. The save-time `validate()` in the
      // editor parent is the authoritative gate (it also checks
      // duplicates across transitions), but surfacing field-level errors
      // here means the user sees what's wrong *while* they're editing
      // instead of being surprised at save.
      const actionVal = selectedTransition.action?.trim() ?? '';
      const capabilityVal = selectedTransition.requiredCapability?.trim() ?? '';
      const actionError = !actionVal
         ? 'Required.'
         : !ACTION_PATTERN.test(actionVal)
           ? 'Use lowercase letters, digits, hyphens — no spaces or colons.'
           : null;
      const capabilityError = !capabilityVal
         ? 'Required.'
         : !CAPABILITY_PATTERN.test(capabilityVal)
           ? 'Format: subject:action (e.g. requests:approve).'
           : null;

      // Capability dropdown options: always show the curated common
      // list, but preserve any pre-existing custom value so legacy or
      // hand-edited rows don't lose their capability when opened.
      const capabilityOptions: SelectOption[] = (() => {
         const list = COMMON_CAPABILITIES.map((c) => ({
            value: c,
            label: c,
         }));
         if (
            capabilityVal &&
            !COMMON_CAPABILITIES.includes(capabilityVal as string)
         ) {
            return [
               { value: capabilityVal, label: `${capabilityVal} (custom)` },
               ...list,
            ];
         }
         return list;
      })();

      // Plain-English read-out of the four-condition rule. Updates live
      // as the user changes any field. Mirrors the API engine's
      // evaluation order exactly so reading it out loud == reasoning
      // about runtime behaviour.
      const scopeOpt = SCOPE_OPTIONS.find(
         (o) => o.value === selectedTransition.scopeRule,
      );
      const appliesOpt = APPLIES_TO_OPTIONS.find(
         (o) => o.value === selectedTransition.appliesTo,
      );
      const scopeClause =
         selectedTransition.scopeRule === 'any'
            ? 'with no extra scope filter'
            : `under "${scopeOpt?.label ?? selectedTransition.scopeRule}"`;
      const appliesClause =
         selectedTransition.appliesTo === 'any'
            ? 'any kind of row'
            : `"${appliesOpt?.label ?? selectedTransition.appliesTo}"`;
      const ruleSummary =
         `A user can "${actionVal || '…'}" a ${selectedTransition.fromState} row ` +
         `(it becomes ${selectedTransition.toState}) only when they hold ` +
         `${capabilityVal || '…'}, ${scopeClause}, and the row matches ${appliesClause}.`;

      return (
         <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            {renderHeader('Transition')}
            <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
               {/* Plain-English summary — read this aloud to sanity-check
                   the rule before saving. It always reflects the current
                   draft, not the persisted value. */}
               <div className="rounded-lg border border-[#B28309]/30 bg-[#B28309]/5 px-3 py-2">
                  <div className="text-[0.6rem] uppercase tracking-wider font-bold text-[#B28309] mb-1">
                     In plain English
                  </div>
                  <p className="text-xs text-[#0F2552] leading-snug">
                     {ruleSummary}
                  </p>
               </div>

               <Field
                  label="From State"
                  required
                  tooltip={{
                     body: 'The starting state the row must be in for this rule to apply. The action is unavailable on rows in any other state.',
                     example:
                        'If From=Pending, this transition only fires on Pending requests — not Approved or Declined ones.',
                  }}
               >
                  <StyledSelect
                     value={selectedTransition.fromState}
                     options={states.map((s) => ({ value: s, label: s }))}
                     onChange={(v) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           fromState: v,
                        })
                     }
                     ariaLabel="From state"
                  />
               </Field>

               <Field
                  label="Action"
                  required
                  error={actionError ?? undefined}
                  hint={
                     !actionError
                        ? 'Verb the user clicks. Lowercase, hyphenated. Must be unique per (From State, Applies To).'
                        : undefined
                  }
                  tooltip={{
                     body: 'The verb the user clicks to fire this transition. Also the action name sent to the API. Must be lowercase, may use digits and hyphens.',
                     example:
                        '"approve", "decline", "assign", "release", "return", "resolve". Use "request-edit" (with a hyphen) rather than "request_edit" or "requestEdit".',
                  }}
               >
                  <input
                     type="text"
                     value={selectedTransition.action}
                     onChange={(e) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           action: e.target.value,
                        })
                     }
                     className={actionError ? INPUT_CLASS_ERROR : INPUT_CLASS}
                     placeholder="e.g. approve"
                  />
               </Field>

               <Field
                  label="To State"
                  required
                  tooltip={{
                     body: 'Where the row lands after the action runs successfully. Set this equal to From State to model a self-loop (e.g. re-assignment that keeps the status as Assigned).',
                     example:
                        'From=Pending, Action=approve, To=Approved → approving a Pending request moves it to Approved.',
                  }}
               >
                  <StyledSelect
                     value={selectedTransition.toState}
                     options={states.map((s) => ({ value: s, label: s }))}
                     onChange={(v) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           toState: v,
                        })
                     }
                     ariaLabel="To state"
                  />
               </Field>

               <Field
                  label="Required Capability"
                  required
                  error={capabilityError ?? undefined}
                  hint={
                     !capabilityError
                        ? 'Permission the actor must hold. Pick from the known list — new strings need a code change to the permission seeder.'
                        : undefined
                  }
                  tooltip={{
                     body: 'The `subject:action` permission string the actor must hold via their role. Without this permission, the actor never reaches the scope check. New capabilities require adding the module to RBAC_MODULES + the action to PermissionAction enum + re-seeding — they can\'t be invented from the UI alone.',
                     example:
                        '"requests:approve" means the actor\'s role must include the "approve" verb on the "requests" subject. HOD role holds this; MEMBER does not.',
                  }}
               >
                  <StyledSelect
                     value={selectedTransition.requiredCapability}
                     options={capabilityOptions}
                     onChange={(v) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           requiredCapability: v,
                        })
                     }
                     ariaLabel="Required capability"
                  />
               </Field>

               <Field
                  label="Scope rule — who can fire this?"
                  hint={
                     SCOPE_OPTIONS.find(
                        (o) => o.value === selectedTransition.scopeRule,
                     )?.hint
                  }
                  tooltip={{
                     body: 'Extra row-level filter applied after the capability check. Answers: "of all the rows the actor is allowed to touch, which ones specifically?" Without this, anyone holding the capability could act on any row of that subject.',
                     example:
                        '"Only the row\'s department" lets an Electrical-dept HOD approve Electrical requests, but blocks them from approving Kitchen requests. The capability allows the verb; the scope rule narrows the row.',
                  }}
               >
                  <StyledSelect
                     value={selectedTransition.scopeRule}
                     options={SCOPE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                     }))}
                     onChange={(v) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           scopeRule: v as WorkflowScopeRule,
                        })
                     }
                     ariaLabel="Scope rule"
                  />
               </Field>

               <Field
                  label="Applies to — which rows?"
                  hint={
                     APPLIES_TO_OPTIONS.find(
                        (o) => o.value === selectedTransition.appliesTo,
                     )?.hint
                  }
                  tooltip={{
                     body: 'Restricts the rule to rows of a specific shape — single, parent, or child. Used by the multi-department request flow. A single-dept request is a "flat" row. A request split across multiple departments has 1 parent row + 1 child row per department.',
                     example:
                        'A request shared between Electrical, Plumbing, and Kitchen creates 1 parent + 3 children. Approving each child independently uses "Child rows only". Cancelling the whole thing as one act would use "Parent rows only".',
                  }}
               >
                  <StyledSelect
                     value={selectedTransition.appliesTo}
                     options={APPLIES_TO_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                     }))}
                     onChange={(v) =>
                        onUpdateTransition(selectedTransitionIndex, {
                           appliesTo: v as WorkflowAppliesTo,
                        })
                     }
                     ariaLabel="Applies to"
                  />
               </Field>

               <Field
                  label="Guard Expression — coming soon"
                  hint="Disabled today. The engine ignores this column; editing it would set an admin's expectation that doesn't match runtime behaviour."
                  tooltip={{
                     body: 'Reserved column for a future expression language that will let an admin attach custom row-level conditions to a transition — beyond what scope rule and applies-to cover. The DSL is not implemented yet, so the field is disabled to avoid misleading anyone.',
                     example:
                        'Future use: "entity.totalValue > 50000" would require a special-handling capability for large requests. Today: writing here changes nothing at runtime.',
                  }}
               >
                  <textarea
                     value={selectedTransition.guardExpression ?? ''}
                     disabled
                     readOnly
                     rows={3}
                     className={`${FIELD_BASE} px-3 py-2 border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed resize-none`}
                     placeholder="(disabled — feature not implemented)"
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
                     className={INPUT_CLASS}
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
                     className={`flex-1 ${FIELD_BASE} px-3 py-2 ${FIELD_BORDER_OK}`}
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
   /** Required-field marker — renders a red asterisk next to the label. */
   required?: boolean;
   /** Inline error text. When present, replaces the hint and turns the
    *  message red. The caller is responsible for adding a red border on
    *  the actual input — the Field component only renders the label and
    *  the message zone. */
   error?: string;
   /** Hover-revealed long-form explanation. Shown as an info icon to
    *  the right of the label. */
   tooltip?: { body: string; example?: string };
   children: React.ReactNode;
}> = ({ label, hint, required, error, tooltip, children }) => (
   <div>
      <label className="flex items-center text-[0.65rem] uppercase tracking-wider font-bold text-gray-400 mb-1">
         <span>
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
         </span>
         {tooltip && <InfoTooltip {...tooltip} />}
      </label>
      {children}
      {error ? (
         <p className="text-[0.65rem] text-red-600 mt-1 leading-snug font-medium">
            {error}
         </p>
      ) : (
         hint && (
            <p className="text-[0.6rem] text-gray-400 mt-1 leading-snug">
               {hint}
            </p>
         )
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
