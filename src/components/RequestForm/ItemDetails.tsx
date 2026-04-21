import React, { useState, useCallback, useMemo } from 'react';
import { DeleteIcon, SearchIcon } from '../Icons';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { itemActions } from '@/actions';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { Department, Item } from '@/types';

interface ItemDetailsProps {
   items: Item[];
   department: Department | null;
   setItems: (items: Item[]) => void;
   setDepartment: (department: Department | null) => void;
   addItem: () => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ items, department, setItems, setDepartment, addItem }) => {
   const dispatch = useDispatch();
   const { allDepartmentsList, IsRequestingUnpaginatedDepartments } = useSelector((s: RootState) => s.department);
   const { IsRequestingAllDepartmentItems, allDepartmentItemsList } = useSelector((s: RootState) => s.item);

   const [search, setSearch] = useState('');
   const [activeDropdown, setActiveDropdown] = useState<'department' | number | null>(null);

   const dropdownRef = useOnClickOutside<HTMLDivElement>(
      useCallback(() => setActiveDropdown(null), []),
   );

   const toggleDropdown = (id: 'department' | number) => {
      setActiveDropdown((prev) => (prev === id ? null : id));
      setSearch('');
   };

   const handleDepartmentSelect = (dept: Department) => {
      setDepartment(dept);
      dispatch(itemActions.getAllDepartmentItems(dept.id) as unknown as UnknownAction);
      setSearch('');
      setActiveDropdown(null);
   };

   const handleSelect = (item: Item, selectedItem: Item) => {
      const updatedItems = items.map((i) =>
         i.id === item.id
            ? {
                 ...i,
                 name: selectedItem.name,
                 id: selectedItem.id,
                 availableQuantity: selectedItem.availableQuantity,
                 storeId: selectedItem.storeId,
                 storeName: selectedItem.storeName,
                 condition: selectedItem.condition,
                 fragile: selectedItem.fragile,
                 requestedQuantity: 1,
              }
            : i,
      );
      setItems(updatedItems);
      setActiveDropdown(null);
      setSearch('');
   };

   const handleQuantityChange = (item: Item, delta: number) => {
      const updatedItems = items.map((i) => {
         if (i.id === item.id) {
            const qty = (i.requestedQuantity || 0) + delta;
            return { ...i, requestedQuantity: Math.max(1, Math.min(qty, i.availableQuantity || 0)) };
         }
         return i;
      });
      setItems(updatedItems);
   };

   const handleDelete = (item: Item) => {
      const updatedItems = items.filter((obj) => obj.id !== item.id);
      setItems(updatedItems.map((obj, index) => ({ ...obj, id: index + 1 })));
      setActiveDropdown(null);
   };

   const filteredDepartments = useMemo(
      () => allDepartmentsList.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())),
      [allDepartmentsList, search],
   );
   const filteredItems = useMemo(
      () => allDepartmentItemsList.filter((i: Item) => i.name.toLowerCase().includes(search.toLowerCase())),
      [allDepartmentItemsList, search],
   );

   return (
      <div>
         {/* Department select */}
         <div ref={activeDropdown === 'department' ? dropdownRef : undefined} className="mb-5 relative">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
               Department*
            </label>
            <button
               type="button"
               onClick={() => toggleDropdown('department')}
               className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer transition-all"
               style={{
                  background: 'var(--surface-low)',
                  border: '1px solid var(--border-strong)',
                  color: department ? 'var(--text-primary)' : 'var(--text-hint)',
               }}
            >
               <span className="truncate">{department?.name || 'Select department'}</span>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  className={`shrink-0 ml-2 transition-transform duration-200 ${activeDropdown === 'department' ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-hint)' }}
               >
                  <polyline points="6 9 12 15 18 9" />
               </svg>
            </button>
            {activeDropdown === 'department' && (
               <div className="absolute z-50 mt-1.5 w-full rounded-lg overflow-hidden animate-dropdown-enter"
                  style={{ background: 'var(--surface-paper)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
               >
                  <div className="px-2.5 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                     <div className="relative">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-hint)' }} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." autoFocus
                           className="w-full pl-8 pr-3 py-2 text-xs rounded-md outline-none"
                           style={{ background: 'var(--surface-low)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        />
                     </div>
                  </div>
                  <ul className="max-h-48 overflow-y-auto py-1">
                     {IsRequestingUnpaginatedDepartments ? (
                        <li className="flex justify-center items-center py-4">
                           <div className="w-5 h-5 border-2 border-[#B28309] border-t-transparent rounded-full animate-spin" />
                        </li>
                     ) : filteredDepartments.length === 0 ? (
                        <li className="px-3.5 py-4 text-xs text-center" style={{ color: 'var(--text-hint)' }}>No departments found</li>
                     ) : (
                        filteredDepartments.map((d) => (
                           <li key={d.id} onClick={() => handleDepartmentSelect(d)}
                              className="px-3.5 py-2 text-xs cursor-pointer transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-low)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                           >
                              {d.name}
                           </li>
                        ))
                     )}
                  </ul>
               </div>
            )}
         </div>

         {/* Item rows */}
         {department &&
            items.map((item, index) => (
               <div key={item.id} className="mb-5 group">
                  <div className="flex justify-between items-center mb-1.5">
                     <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Item {index + 1}*
                     </label>
                     {items.length > 1 && (
                        <button onClick={() => handleDelete(item)}
                           className="flex items-center gap-1 text-[0.65rem] font-medium text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <DeleteIcon className="w-3 h-3" /> Remove
                        </button>
                     )}
                  </div>

                  {/* Item select */}
                  <div className="relative mb-3" ref={activeDropdown === item.id ? dropdownRef : undefined}>
                     <button type="button"
                        onClick={() => toggleDropdown(item.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left cursor-pointer"
                        style={{
                           background: 'var(--surface-low)',
                           border: '1px solid var(--border-strong)',
                           color: item.name ? 'var(--text-primary)' : 'var(--text-hint)',
                        }}
                     >
                        <span className="truncate">{item.name || 'Select item'}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                           className={`shrink-0 ml-2 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`}
                           style={{ color: 'var(--text-hint)' }}
                        >
                           <polyline points="6 9 12 15 18 9" />
                        </svg>
                     </button>
                     {activeDropdown === item.id && (
                        <div className="absolute z-50 mt-1.5 w-full rounded-lg overflow-hidden animate-dropdown-enter"
                           style={{ background: 'var(--surface-paper)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
                        >
                           <div className="px-2.5 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                              <div className="relative">
                                 <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-hint)' }} />
                                 <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." autoFocus
                                    className="w-full pl-8 pr-3 py-2 text-xs rounded-md outline-none"
                                    style={{ background: 'var(--surface-low)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                                 />
                              </div>
                           </div>
                           <ul className="max-h-48 overflow-y-auto py-1">
                              {IsRequestingAllDepartmentItems ? (
                                 <li className="flex justify-center items-center py-4">
                                    <div className="w-5 h-5 border-2 border-[#B28309] border-t-transparent rounded-full animate-spin" />
                                 </li>
                              ) : filteredItems.length === 0 ? (
                                 <li className="px-3.5 py-4 text-xs text-center" style={{ color: 'var(--text-hint)' }}>No items found</li>
                              ) : (
                                 filteredItems.map((ai) => {
                                    const isAvailable = (ai.availableQuantity ?? 0) > 0;
                                    return (
                                       <li
                                          key={ai.name}
                                          onClick={() => isAvailable && handleSelect(item, ai)}
                                          className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
                                             isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                          }`}
                                          style={{ color: 'var(--text-primary)' }}
                                          onMouseEnter={(e) => { if (isAvailable) e.currentTarget.style.background = 'var(--surface-low)'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                       >
                                          <span>{ai.name} ({ai.availableQuantity})</span>
                                          <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full ${
                                             isAvailable
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                                          }`}>
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

                  {/* Availability info */}
                  {item.name && (
                     <p className="text-[0.65rem] mb-3" style={{ color: 'var(--text-hint)' }}>
                        Available: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.availableQuantity}</span> units
                     </p>
                  )}

                  {/* Quantity stepper */}
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                     Requested Quantity
                  </label>
                  <div className="inline-flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-strong)' }}>
                     <button onClick={() => handleQuantityChange(item, -1)}
                        disabled={(item.requestedQuantity || 0) <= 1}
                        className="w-10 h-10 flex items-center justify-center text-sm font-bold cursor-pointer disabled:opacity-30 transition-colors"
                        style={{ background: 'var(--surface-medium)', color: 'var(--text-primary)' }}
                     >
                        −
                     </button>
                     <div className="w-14 h-10 flex items-center justify-center text-sm font-semibold tabular-nums"
                        style={{ background: 'var(--surface-low)', color: 'var(--text-primary)', borderLeft: '1px solid var(--border-default)', borderRight: '1px solid var(--border-default)' }}
                     >
                        {item.requestedQuantity || 0}
                     </div>
                     <button onClick={() => handleQuantityChange(item, 1)}
                        disabled={(item.requestedQuantity || 0) >= (item.availableQuantity || 0)}
                        className="w-10 h-10 flex items-center justify-center text-sm font-bold cursor-pointer disabled:opacity-30 transition-colors"
                        style={{ background: 'var(--surface-medium)', color: 'var(--text-primary)' }}
                     >
                        +
                     </button>
                  </div>
               </div>
            ))}

         {/* Add more */}
         {department && allDepartmentItemsList?.length > 1 && (
            <button onClick={addItem}
               className="w-full py-2.5 mt-1 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
               style={{ background: 'var(--surface-low)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
            >
               + Add another item
            </button>
         )}
      </div>
   );
};

export default ItemDetails;
