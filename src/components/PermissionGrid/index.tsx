import React, { useMemo } from 'react';
import classNames from 'classnames';
import {
   RBAC_MODULES,
   PERMISSION_ACTIONS,
   PermissionAction,
} from '@/constants/rbac-modules.constant';
import { Permission } from '@/types/permission';

/**
 * Action chip colour palette. Three groups:
 *  - CRUD trio (read/write/delete) — green / blue / red.
 *  - Workflow verbs (approve/decline/assign/release/return/resolve) — gold.
 *  - manage wildcard — purple, signals "ownership of the whole subject".
 *
 * Pre-defined Tailwind classes so the JIT compiler picks them up.
 */
const ACTION_COLOR: Record<PermissionAction, string> = {
   read: 'bg-green-50 border-green-300 text-green-700',
   write: 'bg-blue-50 border-blue-300 text-blue-700',
   delete: 'bg-red-50 border-red-300 text-red-700',
   approve: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   decline: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   assign: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   release: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   return: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   resolve: 'bg-[#B28309]/10 border-[#B28309]/40 text-[#B28309]',
   manage: 'bg-purple-50 border-purple-300 text-purple-700',
};

const PREVIEW_ACTION_COLOR: Record<PermissionAction, string> = {
   read: 'bg-green-500/15 text-green-300 border-green-500/30',
   write: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
   delete: 'bg-red-500/15 text-red-300 border-red-500/30',
   approve: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   decline: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   assign: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   release: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   return: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   resolve: 'bg-[#B28309]/20 text-[#D8A12C] border-[#B28309]/40',
   manage: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
};

type Props = {
   permissions: Permission[]; // all 42
   value: Set<number>;         // checked permission IDs
   onChange: (next: Set<number>) => void;
   readOnly?: boolean;
   /** 'editor' = checkboxes + All toggle (default). 'preview' = prembly-style
    *  three action badges per module row, no toggles, no Select-all. */
   variant?: 'editor' | 'preview';
};

const PermissionGrid: React.FC<Props> = ({
   permissions,
   value,
   onChange,
   readOnly = false,
   variant = 'editor',
}) => {
   /** Index permissions by (module, action) for O(1) lookup */
   const index = useMemo(() => {
      const map = new Map<string, Permission>();
      permissions.forEach((p) => {
         map.set(`${p.module}:${p.action}`, p);
      });
      return map;
   }, [permissions]);

   const toggleOne = (permId: number) => {
      if (readOnly) return;
      const next = new Set(value);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      onChange(next);
   };

   const toggleModule = (module: string, enableAll: boolean) => {
      if (readOnly) return;
      const next = new Set(value);
      PERMISSION_ACTIONS.forEach((action) => {
         const p = index.get(`${module}:${action}`);
         if (!p) return;
         enableAll ? next.add(p.id) : next.delete(p.id);
      });
      onChange(next);
   };

   const isModuleFull = (module: string) =>
      PERMISSION_ACTIONS.every((a) => {
         const p = index.get(`${module}:${a}`);
         return p ? value.has(p.id) : false;
      });

   const isModuleEmpty = (module: string) =>
      PERMISSION_ACTIONS.every((a) => {
         const p = index.get(`${module}:${a}`);
         return p ? !value.has(p.id) : true;
      });

   /**
    * Preview variant — shows what a role actually holds. Two design
    * choices vs. the editor:
    *   1. Only render chips for actions the role HAS. The editor
    *      shows every action so the admin can grant any of them;
    *      preview is "what does this role do?", so unselected
    *      actions are noise.
    *   2. The chip row wraps. A role like ADMIN holds enough verbs
    *      across enough subjects to overflow the modal width on the
    *      no-wrap layout — `flex-wrap` keeps the layout sane.
    * Modules with zero held actions are omitted entirely.
    */
   const renderPreviewRow = (m: (typeof RBAC_MODULES)[number]) => {
      const heldActions = PERMISSION_ACTIONS.filter((action) => {
         const perm = index.get(`${m.slug}:${action}`);
         return perm ? value.has(perm.id) : false;
      });
      if (heldActions.length === 0) return null;
      return (
         <div
            key={m.slug}
            className="flex items-start justify-between gap-3 px-4 py-3 border border-white/10 rounded-lg mb-2"
         >
            <div className="flex items-center gap-3 text-white shrink-0 pt-1">
               <span className="text-white/30 text-sm">›</span>
               <div className="font-bold text-sm">{m.label}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 min-w-0">
               {heldActions.map((action: PermissionAction) => (
                  <span
                     key={action}
                     className={classNames(
                        'px-3 py-1 rounded border text-[0.65rem] font-semibold uppercase tracking-wide',
                        PREVIEW_ACTION_COLOR[action],
                     )}
                  >
                     ✓ {action}
                  </span>
               ))}
            </div>
         </div>
      );
   };

   if (variant === 'preview') {
      const rendered = RBAC_MODULES.map(renderPreviewRow).filter(Boolean);
      if (rendered.length === 0) {
         return (
            <div className="px-4 py-6 border border-white/10 rounded-lg text-center text-sm text-white/40">
               This role currently holds no permissions.
            </div>
         );
      }
      return <div>{rendered}</div>;
   }

   return (
      <div className="space-y-3">
         {RBAC_MODULES.map((m) => {
            const moduleFull = isModuleFull(m.slug);
            const moduleEmpty = isModuleEmpty(m.slug);
            return (
               <div
                  key={m.slug}
                  className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 p-4"
               >
                  <div className="flex items-center justify-between mb-3">
                     <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
                        {m.label}
                     </h3>
                     {!readOnly && (
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                           <input
                              type="checkbox"
                              checked={moduleFull}
                              ref={(el) => {
                                 if (el) el.indeterminate = !moduleFull && !moduleEmpty;
                              }}
                              onChange={(e) => toggleModule(m.slug, e.target.checked)}
                              className="accent-[#B28309]"
                           />
                           <span className="text-[#0F2552]/70 dark:text-white/70">All</span>
                        </label>
                     )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {PERMISSION_ACTIONS.map((action: PermissionAction) => {
                        const perm = index.get(`${m.slug}:${action}`);
                        if (!perm) return null;
                        const checked = value.has(perm.id);
                        return (
                           <button
                              key={action}
                              type="button"
                              disabled={readOnly}
                              onClick={() => toggleOne(perm.id)}
                              className={classNames(
                                 'px-3 py-1.5 rounded border text-xs font-semibold uppercase transition-colors',
                                 checked
                                    ? ACTION_COLOR[action]
                                    : 'border-gray-200 text-gray-400',
                                 readOnly && 'cursor-default',
                                 !readOnly && 'cursor-pointer hover:opacity-80',
                              )}
                           >
                              {checked ? '✓ ' : ''}
                              {action}
                           </button>
                        );
                     })}
                  </div>
               </div>
            );
         })}
      </div>
   );
};

export default PermissionGrid;
