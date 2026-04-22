import React, { useMemo } from 'react';
import classNames from 'classnames';
import {
   RBAC_MODULES,
   PERMISSION_ACTIONS,
   PermissionAction,
} from '@/constants/rbac-modules.constant';
import { Permission } from '@/types/permission';

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

   /** Preview variant — prembly-style three-badge layout, no checkboxes */
   const renderPreviewRow = (m: (typeof RBAC_MODULES)[number]) => (
      <div
         key={m.slug}
         className="flex items-center justify-between px-4 py-3 border border-white/10 rounded-lg mb-2"
      >
         <div className="flex items-center gap-3 text-white">
            <span className="text-white/30 text-sm">›</span>
            <div className="font-bold text-sm">{m.label}</div>
         </div>
         <div className="flex gap-2">
            {PERMISSION_ACTIONS.map((action: PermissionAction) => {
               const perm = index.get(`${m.slug}:${action}`);
               const checked = perm ? value.has(perm.id) : false;
               const colorClass =
                  action === 'read'
                     ? 'bg-green-500/15 text-green-300 border-green-500/30'
                     : action === 'write'
                     ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                     : 'bg-red-500/15 text-red-300 border-red-500/30';
               return (
                  <span
                     key={action}
                     className={classNames(
                        'px-3 py-1 rounded border text-[0.65rem] font-semibold uppercase tracking-wide',
                        checked ? colorClass : 'border-white/10 text-white/25',
                     )}
                  >
                     {checked ? '✓ ' : ''}
                     {action}
                  </span>
               );
            })}
         </div>
      </div>
   );

   if (variant === 'preview') {
      return <div>{RBAC_MODULES.map(renderPreviewRow)}</div>;
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
                        const color =
                           action === 'read'
                              ? 'bg-green-50 border-green-300 text-green-700'
                              : action === 'write'
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-red-50 border-red-300 text-red-700';
                        return (
                           <button
                              key={action}
                              type="button"
                              disabled={readOnly}
                              onClick={() => toggleOne(perm.id)}
                              className={classNames(
                                 'px-3 py-1.5 rounded border text-xs font-semibold uppercase transition-colors',
                                 checked ? color : 'border-gray-200 text-gray-400',
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
