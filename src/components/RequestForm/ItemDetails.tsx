import React, { useEffect, useMemo, useState } from 'react';
import { DeleteIcon, SearchIcon } from '../Icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { Department, Item } from '@/types';

/**
 * Per-row state for an item in the request submission form.
 *
 * `rowKey` is a synthetic stable id generated at row creation and never
 * mutated — used as the React `key` and as a row identity for delete /
 * select handlers. It's separate from `itemId` so two rows can pick the
 * same item from different depts without colliding.
 *
 * `itemId` (and the supporting fields) are populated only after the user
 * picks an item; before that they're nullish.
 */
export interface ItemRow {
   rowKey: string;
   departmentId: number | null;
   departmentName: string | null;
   itemId: number | null;
   name: string;
   availableQuantity: number;
   requestedQuantity: number;
}

interface ItemDetailsProps {
   items: ItemRow[];
   setItems: (items: ItemRow[]) => void;
   addItem: () => void;
   description: string;
   setDescription: (value: string) => void;
   descriptionError: boolean;
   showRowErrors: boolean;
   /** Form-level cache of items, keyed by departmentId. */
   itemsByDept: Record<number, Item[]>;
   /** Which departments are currently being fetched. */
   loadingDepts: Record<number, boolean>;
   /** Trigger an items fetch for a department (no-op if cached/in-flight). */
   fetchItemsForDept: (deptId: number) => void;
}

type ActiveDropdown =
   | { kind: 'dept'; rowKey: string }
   | { kind: 'item'; rowKey: string }
   | null;

const ItemDetails: React.FC<ItemDetailsProps> = ({
   items,
   setItems,
   addItem,
   description,
   setDescription,
   descriptionError,
   showRowErrors,
   itemsByDept,
   loadingDepts,
   fetchItemsForDept,
}) => {
   const { allDepartmentsList, IsRequestingUnpaginatedDepartments } = useSelector(
      (s: RootState) => s.department,
   );

   const [search, setSearch] = useState('');
   const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

   const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
      setActiveDropdown(null),
   );

   // Make sure every selected dept has its items fetched. Runs once per
   // unique dept id in the rows. The cache check inside fetchItemsForDept
   // makes this idempotent so we can safely re-run on every render.
   useEffect(() => {
      const seen = new Set<number>();
      for (const row of items) {
         if (row.departmentId != null && !seen.has(row.departmentId)) {
            seen.add(row.departmentId);
            fetchItemsForDept(row.departmentId);
         }
      }
   }, [items, fetchItemsForDept]);

   // Deduped chip strip — same dept used N times shows once. Order is
   // first-seen so the chip layout doesn't shuffle as the user adds more
   // rows in the same dept.
   const involvedDepartments = useMemo(() => {
      const seen = new Map<number, string>();
      for (const row of items) {
         if (row.departmentId != null && !seen.has(row.departmentId)) {
            seen.set(row.departmentId, row.departmentName ?? '—');
         }
      }
      return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
   }, [items]);

   const toggleDeptDropdown = (rowKey: string) => {
      setActiveDropdown((prev) =>
         prev?.kind === 'dept' && prev.rowKey === rowKey
            ? null
            : { kind: 'dept', rowKey },
      );
      setSearch('');
   };

   const toggleItemDropdown = (rowKey: string) => {
      setActiveDropdown((prev) =>
         prev?.kind === 'item' && prev.rowKey === rowKey
            ? null
            : { kind: 'item', rowKey },
      );
      setSearch('');
   };

   const handleDepartmentSelect = (row: ItemRow, dept: Department) => {
      // If the same dept is selected, no-op the row reset — preserves any
      // item the user already picked. Switching dept *must* reset the
      // item, otherwise the row carries an item from the wrong dept.
      const sameDept = row.departmentId === dept.id;
      const updated = items.map((i) =>
         i.rowKey === row.rowKey
            ? sameDept
               ? { ...i }
               : {
                    ...i,
                    departmentId: dept.id,
                    departmentName: dept.name,
                    itemId: null,
                    name: '',
                    availableQuantity: 0,
                    requestedQuantity: 0,
                 }
            : i,
      );
      setItems(updated);
      fetchItemsForDept(dept.id);
      setActiveDropdown(null);
      setSearch('');
   };

   const handleItemSelect = (row: ItemRow, picked: Item) => {
      const updated = items.map((i) =>
         i.rowKey === row.rowKey
            ? {
                 ...i,
                 itemId: picked.id,
                 name: picked.name,
                 availableQuantity: picked.availableQuantity ?? 0,
                 requestedQuantity: 1,
              }
            : i,
      );
      setItems(updated);
      setActiveDropdown(null);
      setSearch('');
   };

   const handleQuantityChange = (row: ItemRow, delta: number) => {
      const updated = items.map((i) => {
         if (i.rowKey !== row.rowKey) return i;
         const qty = (i.requestedQuantity || 0) + delta;
         return {
            ...i,
            requestedQuantity: Math.max(1, Math.min(qty, i.availableQuantity || 0)),
         };
      });
      setItems(updated);
   };

   const handleDelete = (row: ItemRow) => {
      const updated = items.filter((i) => i.rowKey !== row.rowKey);
      setItems(updated);
      setActiveDropdown(null);
   };

   const filteredDepartments = useMemo(
      () =>
         allDepartmentsList.filter((d: Department) =>
            d.name.toLowerCase().includes(search.toLowerCase()),
         ),
      [allDepartmentsList, search],
   );

   return (
      <div>
         {/* ── Labels chips strip ── */}
         {/* Auto-populated and deduped — gives the requester a quick
                visual of which departments their request will fan out to.
                Empty until at least one row picks a dept. */}
         <div className="mb-5">
            <label
               className="block text-xs font-semibold mb-1.5"
               style={{ color: 'var(--text-secondary)' }}
            >
               Departments involved
            </label>
            {involvedDepartments.length === 0 ? (
               <p
                  className="text-[0.7rem]"
                  style={{ color: 'var(--text-hint)' }}
               >
                  Add an item below to see departments involved.
               </p>
            ) : (
               <div className="flex flex-wrap gap-1.5">
                  {involvedDepartments.map((d) => (
                     <span
                        key={d.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.65rem] font-semibold"
                        style={{
                           background: 'var(--surface-medium)',
                           color: 'var(--text-secondary)',
                           border: '1px solid var(--border-default)',
                        }}
                     >
                        {d.name}
                     </span>
                  ))}
               </div>
            )}
         </div>

         {/* ── Mandatory description ── */}
         {/* Lives on Step 1 (was Step 3) because alien HODs need that
                context up-front when the request fans out across depts. */}
         <div className="mb-5">
            <label
               className="block text-xs font-semibold mb-1.5"
               style={{ color: 'var(--text-secondary)' }}
            >
               Description*
            </label>
            <textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="What's this request for?"
               rows={3}
               className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
               style={{
                  background: 'var(--surface-low)',
                  border: descriptionError
                     ? '1px solid #ef4444'
                     : '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
               }}
            />
            {descriptionError && (
               <p className="text-red-500 text-[0.65rem] mt-1">
                  Description must be at least 5 characters.
               </p>
            )}
         </div>

         {/* ── Item rows ── */}
         {items.map((row, index) => {
            const deptDropdownOpen =
               activeDropdown?.kind === 'dept' && activeDropdown.rowKey === row.rowKey;
            const itemDropdownOpen =
               activeDropdown?.kind === 'item' && activeDropdown.rowKey === row.rowKey;

            const deptItems =
               row.departmentId != null ? itemsByDept[row.departmentId] ?? [] : [];
            const isLoadingItems =
               row.departmentId != null && !!loadingDepts[row.departmentId];
            const filteredItems = deptItems.filter((it) =>
               it.name.toLowerCase().includes(search.toLowerCase()),
            );

            const rowError =
               showRowErrors &&
               (row.departmentId == null ||
                  row.itemId == null ||
                  (row.requestedQuantity || 0) < 1);

            return (
               <div
                  key={row.rowKey}
                  className="mb-5 group p-3 rounded-lg"
                  style={{
                     border: rowError
                        ? '1px solid #ef4444'
                        : '1px solid var(--border-default)',
                     background: 'var(--surface-paper)',
                  }}
               >
                  <div className="flex justify-between items-center mb-2">
                     <label
                        className="text-xs font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                     >
                        Item {index + 1}*
                     </label>
                     {items.length > 1 && (
                        <button
                           onClick={() => handleDelete(row)}
                           className="flex items-center gap-1 text-[0.65rem] font-medium text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <DeleteIcon className="w-3 h-3" /> Remove
                        </button>
                     )}
                  </div>

                  {/* Department + Item dropdowns side by side on md+,
                          stacked on mobile. */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                     {/* Department dropdown */}
                     <div
                        className="relative"
                        ref={deptDropdownOpen ? dropdownRef : undefined}
                     >
                        <button
                           type="button"
                           onClick={() => toggleDeptDropdown(row.rowKey)}
                           className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer"
                           style={{
                              background: 'var(--surface-low)',
                              border: '1px solid var(--border-strong)',
                              color: row.departmentName
                                 ? 'var(--text-primary)'
                                 : 'var(--text-hint)',
                           }}
                        >
                           <span className="truncate">
                              {row.departmentName || 'Select department'}
                           </span>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className={`shrink-0 ml-2 transition-transform duration-200 ${
                                 deptDropdownOpen ? 'rotate-180' : ''
                              }`}
                              style={{ color: 'var(--text-hint)' }}
                           >
                              <polyline points="6 9 12 15 18 9" />
                           </svg>
                        </button>
                        {deptDropdownOpen && (
                           <div
                              className="absolute z-50 mt-1.5 w-full rounded-lg overflow-hidden animate-dropdown-enter"
                              style={{
                                 background: 'var(--surface-paper)',
                                 border: '1px solid var(--border-default)',
                                 boxShadow: 'var(--shadow-lg)',
                              }}
                           >
                              <div
                                 className="px-2.5 pt-2.5 pb-1.5"
                                 style={{
                                    borderBottom: '1px solid var(--border-default)',
                                 }}
                              >
                                 <div className="relative">
                                    <SearchIcon
                                       className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                       style={{ color: 'var(--text-hint)' }}
                                    />
                                    <input
                                       type="text"
                                       value={search}
                                       onChange={(e) => setSearch(e.target.value)}
                                       placeholder="Search departments..."
                                       autoFocus
                                       className="w-full pl-8 pr-3 py-2 text-xs rounded-md outline-none"
                                       style={{
                                          background: 'var(--surface-low)',
                                          border: '1px solid var(--border-default)',
                                          color: 'var(--text-primary)',
                                       }}
                                    />
                                 </div>
                              </div>
                              <ul className="max-h-48 overflow-y-auto py-1">
                                 {IsRequestingUnpaginatedDepartments ? (
                                    <li className="flex justify-center items-center py-4">
                                       <div className="w-5 h-5 border-2 border-[#B28309] border-t-transparent rounded-full animate-spin" />
                                    </li>
                                 ) : filteredDepartments.length === 0 ? (
                                    <li
                                       className="px-3.5 py-4 text-xs text-center"
                                       style={{ color: 'var(--text-hint)' }}
                                    >
                                       No departments found
                                    </li>
                                 ) : (
                                    filteredDepartments.map((d: Department) => (
                                       <li
                                          key={d.id}
                                          onClick={() => handleDepartmentSelect(row, d)}
                                          className="px-3.5 py-2 text-xs cursor-pointer transition-colors"
                                          style={{ color: 'var(--text-primary)' }}
                                          onMouseEnter={(e) => {
                                             e.currentTarget.style.background =
                                                'var(--surface-low)';
                                          }}
                                          onMouseLeave={(e) => {
                                             e.currentTarget.style.background =
                                                'transparent';
                                          }}
                                       >
                                          {d.name}
                                       </li>
                                    ))
                                 )}
                              </ul>
                           </div>
                        )}
                     </div>

                     {/* Item dropdown — disabled until dept picked. */}
                     <div
                        className="relative"
                        ref={itemDropdownOpen ? dropdownRef : undefined}
                     >
                        <button
                           type="button"
                           onClick={() =>
                              row.departmentId != null && toggleItemDropdown(row.rowKey)
                           }
                           disabled={row.departmentId == null}
                           className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer disabled:cursor-not-allowed"
                           style={{
                              background: 'var(--surface-low)',
                              border: '1px solid var(--border-strong)',
                              color: row.name
                                 ? 'var(--text-primary)'
                                 : 'var(--text-hint)',
                              opacity: row.departmentId == null ? 0.6 : 1,
                           }}
                        >
                           <span className="truncate">
                              {row.name ||
                                 (row.departmentId == null
                                    ? 'Select a department first'
                                    : 'Select item')}
                           </span>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className={`shrink-0 ml-2 transition-transform ${
                                 itemDropdownOpen ? 'rotate-180' : ''
                              }`}
                              style={{ color: 'var(--text-hint)' }}
                           >
                              <polyline points="6 9 12 15 18 9" />
                           </svg>
                        </button>
                        {itemDropdownOpen && (
                           <div
                              className="absolute z-50 mt-1.5 w-full rounded-lg overflow-hidden animate-dropdown-enter"
                              style={{
                                 background: 'var(--surface-paper)',
                                 border: '1px solid var(--border-default)',
                                 boxShadow: 'var(--shadow-lg)',
                              }}
                           >
                              <div
                                 className="px-2.5 pt-2.5 pb-1.5"
                                 style={{
                                    borderBottom: '1px solid var(--border-default)',
                                 }}
                              >
                                 <div className="relative">
                                    <SearchIcon
                                       className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                       style={{ color: 'var(--text-hint)' }}
                                    />
                                    <input
                                       type="text"
                                       value={search}
                                       onChange={(e) => setSearch(e.target.value)}
                                       placeholder="Search items..."
                                       autoFocus
                                       className="w-full pl-8 pr-3 py-2 text-xs rounded-md outline-none"
                                       style={{
                                          background: 'var(--surface-low)',
                                          border: '1px solid var(--border-default)',
                                          color: 'var(--text-primary)',
                                       }}
                                    />
                                 </div>
                              </div>
                              <ul className="max-h-48 overflow-y-auto py-1">
                                 {isLoadingItems ? (
                                    <li className="flex justify-center items-center py-4">
                                       <div className="w-5 h-5 border-2 border-[#B28309] border-t-transparent rounded-full animate-spin" />
                                    </li>
                                 ) : filteredItems.length === 0 ? (
                                    <li
                                       className="px-3.5 py-4 text-xs text-center"
                                       style={{ color: 'var(--text-hint)' }}
                                    >
                                       No items found
                                    </li>
                                 ) : (
                                    filteredItems.map((ai) => {
                                       const isAvailable =
                                          (ai.availableQuantity ?? 0) > 0;
                                       return (
                                          <li
                                             key={ai.id}
                                             onClick={() =>
                                                isAvailable && handleItemSelect(row, ai)
                                             }
                                             className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                                                isAvailable
                                                   ? 'cursor-pointer'
                                                   : 'cursor-not-allowed opacity-50'
                                             }`}
                                             style={{ color: 'var(--text-primary)' }}
                                             onMouseEnter={(e) => {
                                                if (isAvailable)
                                                   e.currentTarget.style.background =
                                                      'var(--surface-low)';
                                             }}
                                             onMouseLeave={(e) => {
                                                e.currentTarget.style.background =
                                                   'transparent';
                                             }}
                                          >
                                             <span>
                                                {ai.name} ({ai.availableQuantity})
                                             </span>
                                             <span
                                                className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full ${
                                                   isAvailable
                                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                      : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                                                }`}
                                             >
                                                {isAvailable ? 'Available' : 'Unavailable'}
                                             </span>
                                          </li>
                                       );
                                    })
                                 )}
                              </ul>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Availability info */}
                  {row.name && (
                     <p
                        className="text-[0.65rem] mb-2"
                        style={{ color: 'var(--text-hint)' }}
                     >
                        Available:{' '}
                        <span
                           className="font-semibold"
                           style={{ color: 'var(--text-primary)' }}
                        >
                           {row.availableQuantity}
                        </span>{' '}
                        units
                     </p>
                  )}

                  {/* Quantity stepper — full-width below the dropdown row. */}
                  <label
                     className="block text-xs font-semibold mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}
                  >
                     Requested Quantity
                  </label>
                  <div
                     className="inline-flex items-center rounded-lg overflow-hidden"
                     style={{ border: '1px solid var(--border-strong)' }}
                  >
                     <button
                        onClick={() => handleQuantityChange(row, -1)}
                        disabled={(row.requestedQuantity || 0) <= 1}
                        className="w-10 h-10 flex items-center justify-center text-sm font-bold cursor-pointer disabled:opacity-30 transition-colors"
                        style={{
                           background: 'var(--surface-medium)',
                           color: 'var(--text-primary)',
                        }}
                     >
                        −
                     </button>
                     <div
                        className="w-14 h-10 flex items-center justify-center text-sm font-semibold tabular-nums"
                        style={{
                           background: 'var(--surface-low)',
                           color: 'var(--text-primary)',
                           borderLeft: '1px solid var(--border-default)',
                           borderRight: '1px solid var(--border-default)',
                        }}
                     >
                        {row.requestedQuantity || 0}
                     </div>
                     <button
                        onClick={() => handleQuantityChange(row, 1)}
                        disabled={
                           (row.requestedQuantity || 0) >= (row.availableQuantity || 0)
                        }
                        className="w-10 h-10 flex items-center justify-center text-sm font-bold cursor-pointer disabled:opacity-30 transition-colors"
                        style={{
                           background: 'var(--surface-medium)',
                           color: 'var(--text-primary)',
                        }}
                     >
                        +
                     </button>
                  </div>

                  {rowError && (
                     <p className="text-red-500 text-[0.65rem] mt-2">
                        Pick a department, item, and quantity (≥ 1) for this row.
                     </p>
                  )}
               </div>
            );
         })}

         {/* Add more */}
         <button
            onClick={addItem}
            className="w-full py-2.5 mt-1 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            style={{
               background: 'var(--surface-low)',
               border: '1px solid var(--border-default)',
               color: 'var(--text-secondary)',
            }}
         >
            + Add another item
         </button>
      </div>
   );
};

export default ItemDetails;
