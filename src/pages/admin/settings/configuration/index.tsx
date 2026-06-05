import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import PrivateRoute from '@/components/PrivateRoute';
import SettingsShell from '@/components/SettingsShell';
import TableSkeletonRow from '@/components/TableSkeletonRow';
import { RootState } from '@/redux/reducers';
import { configActions } from '@/actions/config.action';
import { departmentActions, categoryActions } from '@/actions';
import { Permission } from '@/constants/permissions.enum';
import { AppSetting } from '@/types/config';
import { ComboBox } from '@/components/ui/combo-box';

// ── Icons ────────────────────────────────────────────────────────────────────

const SaveIcon = (
   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
   </svg>
);

const ResetIcon = (
   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.36" />
   </svg>
);

// ── Setting row editor ────────────────────────────────────────────────────────

interface DeptOption {
   id: number | string;
   name: string;
}

interface CatOption {
   id: number | string;
   name: string;
}

interface SettingRowProps {
   setting: AppSetting;
   departments: DeptOption[];
   categories: CatOption[];
   isMutating: boolean;
   onSave: (key: string, value: string) => void;
   onReset: (key: string) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
   setting,
   departments,
   categories,
   isMutating,
   onSave,
   onReset,
}) => {
   const currentValue = setting.value ?? setting.defaultValue ?? '';
   const [localValue, setLocalValue] = useState<string>(currentValue);
   const isDirty = localValue !== currentValue;

   // Sync if the store updates (e.g. after save success)
   useEffect(() => {
      setLocalValue(setting.value ?? setting.defaultValue ?? '');
   }, [setting.value, setting.defaultValue]);

   const renderEditor = () => {
      switch (setting.valueType) {
         case 'boolean':
            return (
               <ComboBox
                  value={localValue}
                  onChange={(v) => setLocalValue(v)}
                  searchable={false}
                  placeholder="Select"
                  options={[
                     { value: 'true', label: 'Yes' },
                     { value: 'false', label: 'No' },
                  ]}
               />
            );

         case 'number':
            return (
               <input
                  type="number"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                     background: 'var(--surface-medium)',
                     border: '1px solid var(--border-strong)',
                     color: 'var(--text-primary)',
                  }}
               />
            );

         case 'department_ref':
            return (
               <ComboBox
                  value={localValue}
                  onChange={(v) => setLocalValue(v)}
                  searchable
                  placeholder="Select department"
                  options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
               />
            );

         case 'category_ref':
            return (
               <ComboBox
                  value={localValue}
                  onChange={(v) => setLocalValue(v)}
                  searchable
                  placeholder="Select category"
                  options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
               />
            );

         default: // string
            return (
               <input
                  type="text"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                     background: 'var(--surface-medium)',
                     border: '1px solid var(--border-strong)',
                     color: 'var(--text-primary)',
                  }}
               />
            );
      }
   };

   // Human-readable display of the current persisted value
   const displayCurrent = (): string => {
      const raw = setting.value ?? setting.defaultValue ?? '—';
      if (setting.valueType === 'department_ref') {
         const dept = departments.find((d) => String(d.id) === raw);
         return dept ? dept.name : raw;
      }
      if (setting.valueType === 'category_ref') {
         const cat = categories.find((c) => String(c.id) === raw);
         return cat ? cat.name : raw;
      }
      if (setting.valueType === 'boolean') {
         return raw === 'true' ? 'Yes' : raw === 'false' ? 'No' : raw;
      }
      return raw;
   };

   return (
      <tr className="border-b border-gray-100 dark:border-white/5 last:border-0">
         {/* Label + description */}
         <td className="px-6 py-4 align-top w-[28%]">
            <div className="text-sm font-semibold text-[#0F2552] dark:text-white/90">
               {setting.label}
            </div>
            {setting.description && (
               <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5 max-w-xs break-words">
                  {setting.description}
               </div>
            )}
            <code className="text-[0.6rem] px-1.5 py-0.5 rounded mt-1 inline-block bg-gray-100 dark:bg-white/10 font-mono text-gray-500 dark:text-white/40">
               {setting.key}
            </code>
         </td>

         {/* Current / default */}
         <td className="px-6 py-4 align-top w-[18%]">
            <div className="text-xs text-[#0F2552] dark:text-white/80 font-medium">
               {displayCurrent()}
            </div>
            {setting.defaultValue !== null && setting.defaultValue !== undefined && (
               <div className="text-[0.65rem] text-gray-400 dark:text-white/40 mt-0.5">
                  Default:{' '}
                  {(() => {
                     const raw = setting.defaultValue ?? '';
                     if (setting.valueType === 'department_ref') {
                        const dept = departments.find((d) => String(d.id) === raw);
                        return dept ? dept.name : raw || '—';
                     }
                     if (setting.valueType === 'category_ref') {
                        const cat = categories.find((c) => String(c.id) === raw);
                        return cat ? cat.name : raw || '—';
                     }
                     if (setting.valueType === 'boolean') {
                        return raw === 'true' ? 'Yes' : raw === 'false' ? 'No' : raw || '—';
                     }
                     return raw || '—';
                  })()}
               </div>
            )}
         </td>

         {/* Editor */}
         <td className="px-6 py-4 align-top w-[32%]">
            {renderEditor()}
         </td>

         {/* Actions */}
         <td className="px-6 py-4 align-top text-right w-[22%] whitespace-nowrap">
            <div className="flex items-center justify-end gap-2">
               <button
                  type="button"
                  onClick={() => onSave(setting.key, localValue)}
                  disabled={!isDirty || isMutating}
                  title="Save"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: isDirty ? 'var(--color-secondary)' : 'var(--surface-medium)' }}
               >
                  {SaveIcon}
                  Save
               </button>
               <button
                  type="button"
                  onClick={() => {
                     setLocalValue(setting.defaultValue ?? '');
                     onReset(setting.key);
                  }}
                  disabled={isMutating}
                  title="Reset to default"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                     borderColor: 'var(--border-strong)',
                     color: 'var(--text-secondary)',
                  }}
               >
                  {ResetIcon}
                  Reset
               </button>
            </div>
         </td>
      </tr>
   );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const ConfigurationPage: NextPageWithLayout = () => {
   const dispatch = useDispatch();
   const { settings, isMutating } = useSelector((s: RootState) => s.config);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allCategoriesList } = useSelector((s: RootState) => s.category);

   useEffect(() => {
      dispatch(configActions.getSettings() as unknown as UnknownAction);
      dispatch(departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction);
      dispatch(categoryActions.getCategories() as unknown as UnknownAction);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const departments: DeptOption[] = useMemo(
      () => (allDepartmentsList ?? []).map((d) => ({ id: d.id, name: d.name })),
      [allDepartmentsList],
   );

   const categories: CatOption[] = useMemo(
      () => (allCategoriesList ?? []).map((c) => ({ id: c.id, name: c.name })),
      [allCategoriesList],
   );

   // Group settings by their `group` field, preserving insertion order
   const groups = useMemo<[string, AppSetting[]][]>(() => {
      const map = new Map<string, AppSetting[]>();
      (settings ?? []).forEach((s) => {
         const key = s.group ?? 'General';
         if (!map.has(key)) map.set(key, []);
         map.get(key)!.push(s);
      });
      return Array.from(map.entries());
   }, [settings]);

   const handleSave = (key: string, value: string) => {
      dispatch(configActions.updateSetting(key, value) as unknown as UnknownAction);
   };

   const handleReset = (key: string) => {
      dispatch(configActions.resetSetting(key) as unknown as UnknownAction);
   };

   const handleRefresh = () => {
      dispatch(configActions.getSettings() as unknown as UnknownAction);
   };

   const isLoading = !settings || (settings.length === 0 && groups.length === 0);

   return (
      <SettingsShell active="configuration">
         <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
                     Configuration
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                     Manage system-wide operational settings such as department and category designations.
                  </p>
               </div>
               <div className="flex gap-2">
                  <button
                     onClick={handleRefresh}
                     className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#B28309] text-[#B28309] text-xs font-semibold hover:bg-[#B28309]/10 cursor-pointer"
                  >
                     ↻ Refresh
                  </button>
               </div>
            </div>

            {/* Setting groups */}
            {isLoading ? (
               <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
                  <div className="overflow-auto" style={{ minHeight: '200px' }}>
                     <table className="w-full">
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                           <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A33]">
                              <th className="px-6 py-3 text-left font-semibold bg-inherit">Setting</th>
                              <th className="px-6 py-3 text-left font-semibold bg-inherit">Current / Default</th>
                              <th className="px-6 py-3 text-left font-semibold bg-inherit">Value</th>
                              <th className="px-6 py-3 text-right font-semibold bg-inherit">Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {Array.from({ length: 3 }).map((_, i) => (
                              <TableSkeletonRow
                                 key={`sk-${i}`}
                                 cols={4}
                                 widths={['28%', '18%', '32%', '22%']}
                              />
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            ) : groups.length === 0 ? (
               <div className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 p-10 text-center text-sm text-gray-500">
                  No configuration settings found.
               </div>
            ) : (
               groups.map(([groupName, groupSettings]) => (
                  <div
                     key={groupName}
                     className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden"
                  >
                     {/* Group header */}
                     <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                        <h3 className="text-[0.65rem] uppercase tracking-wider font-semibold text-gray-400 dark:text-white/40">
                           {groupName}
                        </h3>
                     </div>

                     <div className="overflow-auto">
                        <table className="w-full">
                           <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr className="text-[0.65rem] uppercase tracking-wider text-gray-400 dark:text-white/40 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F1A33]">
                                 <th className="px-6 py-3 text-left font-semibold w-[28%] bg-inherit">Setting</th>
                                 <th className="px-6 py-3 text-left font-semibold w-[18%] bg-inherit">Current / Default</th>
                                 <th className="px-6 py-3 text-left font-semibold w-[32%] bg-inherit">Value</th>
                                 <th className="px-6 py-3 text-right font-semibold w-[22%] bg-inherit">Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {groupSettings.map((setting) => (
                                 <SettingRow
                                    key={setting.key}
                                    setting={setting}
                                    departments={departments}
                                    categories={categories}
                                    isMutating={isMutating}
                                    onSave={handleSave}
                                    onReset={handleReset}
                                 />
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ))
            )}
         </div>
      </SettingsShell>
   );
};

ConfigurationPage.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.ROLES_MANAGE]}>
      <Layout title="Configuration">{page}</Layout>
   </PrivateRoute>
);

export default ConfigurationPage;
