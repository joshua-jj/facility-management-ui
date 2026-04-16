import React, { useState, useMemo, useCallback } from 'react';

interface PermissionItem {
   id: number;
   name: string;
   description?: string;
}

interface TransferPaneProps {
   available: PermissionItem[];
   assigned: PermissionItem[];
   onAdd: (ids: number[]) => void;
   onRemove: (ids: number[]) => void;
   loading?: boolean;
   availableTitle?: string;
   assignedTitle?: string;
}

interface PaneProps {
   title: string;
   items: PermissionItem[];
   checked: Set<number>;
   onToggle: (id: number) => void;
   onToggleAll: () => void;
   allChecked: boolean;
   someChecked: boolean;
}

const Pane: React.FC<PaneProps> = ({ title, items, checked, onToggle, onToggleAll, allChecked, someChecked }) => {
   const [search, setSearch] = useState('');

   const filtered = useMemo(() => {
      if (!search.trim()) return items;
      const q = search.toLowerCase();
      return items.filter(
         (item) => item.name.toLowerCase().includes(q) || (item.description?.toLowerCase().includes(q) ?? false),
      );
   }, [items, search]);

   const formatName = (name: string) =>
      name
         .split('_')
         .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
         .join(' ');

   return (
      <div
         className="flex flex-col flex-1 rounded-xl overflow-hidden min-h-[400px]"
         style={{ border: '1px solid var(--border-default)', background: 'var(--surface-paper)' }}
      >
         {/* Header */}
         <div
            className="px-3 py-2.5 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--surface-low)' }}
         >
            <input
               type="checkbox"
               checked={allChecked}
               ref={(el) => {
                  if (el) el.indeterminate = someChecked;
               }}
               onChange={onToggleAll}
               disabled={items.length === 0}
               className="w-3.5 h-3.5 rounded cursor-pointer"
               style={{ accentColor: 'var(--color-secondary)' }}
            />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)', flex: 1 }}>
               {title} ({items.length})
            </span>
         </div>

         {/* Search */}
         <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="relative">
               <svg
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--text-secondary)' }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
               </svg>
               <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none"
                  style={{
                     background: 'var(--surface-paper)',
                     border: '1px solid var(--border-default)',
                     color: 'var(--text-primary)',
                  }}
               />
            </div>
         </div>

         {/* Items */}
         <div className="flex-1 overflow-y-auto" style={{ maxHeight: 340 }}>
            {filtered.length === 0 && (
               <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                     No permissions found
                  </span>
               </div>
            )}
            {filtered.map((item) => (
               <div
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{
                     borderBottom: '1px solid var(--border-default)',
                     background: checked.has(item.id) ? 'color-mix(in srgb, var(--color-secondary) 8%, transparent)' : undefined,
                  }}
               >
                  <input
                     type="checkbox"
                     checked={checked.has(item.id)}
                     onChange={() => onToggle(item.id)}
                     onClick={(e) => e.stopPropagation()}
                     className="w-3.5 h-3.5 mt-0.5 rounded cursor-pointer shrink-0"
                     style={{ accentColor: 'var(--color-secondary)' }}
                  />
                  <div className="min-w-0">
                     <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
                        {formatName(item.name)}
                     </p>
                     {item.description && (
                        <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                           {item.description}
                        </p>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

const TransferPane: React.FC<TransferPaneProps> = ({
   available,
   assigned,
   onAdd,
   onRemove,
   loading = false,
   availableTitle = 'Available',
   assignedTitle = 'Assigned',
}) => {
   const [availableChecked, setAvailableChecked] = useState<Set<number>>(new Set());
   const [assignedChecked, setAssignedChecked] = useState<Set<number>>(new Set());

   const toggleAvailable = useCallback((id: number) => {
      setAvailableChecked((prev) => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id);
         else next.add(id);
         return next;
      });
   }, []);

   const toggleAssigned = useCallback((id: number) => {
      setAssignedChecked((prev) => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id);
         else next.add(id);
         return next;
      });
   }, []);

   const toggleAllAvailable = useCallback(() => {
      setAvailableChecked((prev) => {
         const allIds = available.map((p) => p.id);
         return allIds.every((id) => prev.has(id)) ? new Set() : new Set(allIds);
      });
   }, [available]);

   const toggleAllAssigned = useCallback(() => {
      setAssignedChecked((prev) => {
         const allIds = assigned.map((p) => p.id);
         return allIds.every((id) => prev.has(id)) ? new Set() : new Set(allIds);
      });
   }, [assigned]);

   const availableAllChecked = available.length > 0 && available.every((p) => availableChecked.has(p.id));
   const availableSomeChecked = !availableAllChecked && available.some((p) => availableChecked.has(p.id));
   const assignedAllChecked = assigned.length > 0 && assigned.every((p) => assignedChecked.has(p.id));
   const assignedSomeChecked = !assignedAllChecked && assigned.some((p) => assignedChecked.has(p.id));

   const handleAdd = () => {
      const ids = Array.from(availableChecked);
      if (ids.length === 0) return;
      onAdd(ids);
      setAvailableChecked(new Set());
   };

   const handleRemove = () => {
      const ids = Array.from(assignedChecked);
      if (ids.length === 0) return;
      onRemove(ids);
      setAssignedChecked(new Set());
   };

   const handleAddAll = () => {
      const ids = available.map((p) => p.id);
      if (ids.length === 0) return;
      onAdd(ids);
      setAvailableChecked(new Set());
   };

   const handleRemoveAll = () => {
      const ids = assigned.map((p) => p.id);
      if (ids.length === 0) return;
      onRemove(ids);
      setAssignedChecked(new Set());
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center py-16">
            <div
               className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: 'var(--color-secondary)', borderTopColor: 'transparent' }}
            />
         </div>
      );
   }

   const btnBase =
      'w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

   return (
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
         <Pane
            title={availableTitle}
            items={available}
            checked={availableChecked}
            onToggle={toggleAvailable}
            onToggleAll={toggleAllAvailable}
            allChecked={availableAllChecked}
            someChecked={availableSomeChecked}
         />

         {/* Move buttons */}
         <div className="flex md:flex-col flex-row items-center justify-center gap-2 py-2 md:py-0 px-0 md:px-1">
            {/* Add all */}
            <button
               onClick={handleAddAll}
               disabled={available.length === 0}
               title="Add all"
               className={btnBase}
               style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
               </svg>
            </button>

            {/* Add selected */}
            <button
               onClick={handleAdd}
               disabled={availableChecked.size === 0}
               title="Add selected"
               className={btnBase}
               style={{
                  border: '1px solid var(--border-default)',
                  background: availableChecked.size > 0 ? 'var(--color-secondary)' : undefined,
                  color: availableChecked.size > 0 ? '#fff' : 'var(--text-secondary)',
               }}
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
               </svg>
            </button>

            {/* Remove selected */}
            <button
               onClick={handleRemove}
               disabled={assignedChecked.size === 0}
               title="Remove selected"
               className={btnBase}
               style={{
                  border: '1px solid var(--border-default)',
                  background: assignedChecked.size > 0 ? 'var(--color-secondary)' : undefined,
                  color: assignedChecked.size > 0 ? '#fff' : 'var(--text-secondary)',
               }}
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
               </svg>
            </button>

            {/* Remove all */}
            <button
               onClick={handleRemoveAll}
               disabled={assigned.length === 0}
               title="Remove all"
               className={btnBase}
               style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
               </svg>
            </button>
         </div>

         <Pane
            title={assignedTitle}
            items={assigned}
            checked={assignedChecked}
            onToggle={toggleAssigned}
            onToggleAll={toggleAllAssigned}
            allChecked={assignedAllChecked}
            someChecked={assignedSomeChecked}
         />
      </div>
   );
};

export default TransferPane;
