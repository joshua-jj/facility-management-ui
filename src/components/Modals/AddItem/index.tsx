import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import NumberInput from '@/components/Inputs/NumberInput';
import SelectInput from '@/components/Inputs/SelectInput';
import ModalWrapper from '../ModalWrapper';
import { RootState } from '@/redux/reducers';
import { useDispatch, useSelector } from 'react-redux';
import { Department, Item, ItemForm, Store } from '@/types';
import { appActions, departmentActions, itemActions, storeActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { itemConstants } from '@/constants';
import Router from 'next/router';

interface AddItemModalProps {
   children?: ReactNode;
   className: string;
   item?: Item | null;
   open?: boolean;
   onClose?: () => void;
}

const AddItem: React.FC<AddItemModalProps> = ({ className, children, item, onClose, open }) => {
   const dispatch = useDispatch();
   const { IsCreatingItem, allItemsList } = useSelector((s: RootState) => s.item);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allStoresList } = useSelector((s: RootState) => s.store);
   const { userDetails } = useSelector((s: RootState) => s.user);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedDeptId, setSelectedDeptId] = useState<string>(
      item?.department?.id ? String(item.department.id) : '',
   );
   const [fragile, setFragile] = useState(item?.fragile ? 'true' : 'false');
   const [trackingMode, setTrackingMode] = useState(item?.trackingMode || 'Quantity');
   const [storeId, setStoreId] = useState<string>('');
   const [items, setItems] = useState<ItemForm[]>([]);
   const [editIndex, setEditIndex] = useState<number | null>(null);

   // Searchable name field state
   const [nameInput, setNameInput] = useState<string>(item?.name ?? '');
   const [showSuggestions, setShowSuggestions] = useState(false);
   const [selectedExistingItem, setSelectedExistingItem] = useState<Item | null>(null);
   const nameInputRef = useRef<HTMLInputElement>(null);
   const suggestionsRef = useRef<HTMLDivElement>(null);

   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (onClose) onClose();
   }, [onClose]);

   useEffect(() => {
      if (allDepartmentsList?.length === 0) {
         dispatch(departmentActions.getAllDepartments() as unknown as UnknownAction);
      }
      if (allStoresList?.length === 0) {
         dispatch(storeActions.getStores() as unknown as UnknownAction);
      }
   }, [dispatch, allDepartmentsList, allStoresList]);

   // Load all items for the suggestion list on mount
   useEffect(() => {
      if (!allItemsList || allItemsList.length === 0) {
         dispatch(itemActions.getAllItems({ page: 1, limit: 1000 }) as unknown as UnknownAction);
      }
   }, [dispatch, allItemsList]);

   // Close suggestions on outside click
   useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
         if (
            suggestionsRef.current &&
            !suggestionsRef.current.contains(e.target as Node) &&
            nameInputRef.current &&
            !nameInputRef.current.contains(e.target as Node)
         ) {
            setShowSuggestions(false);
         }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
   }, []);

   const filteredSuggestions = (allItemsList ?? []).filter(
      (i: Item) =>
         nameInput.trim().length > 0 &&
         !selectedExistingItem &&
         i.name.toLowerCase().includes(nameInput.trim().toLowerCase()),
   );

   const handleSelectExistingItem = (selected: Item) => {
      setSelectedExistingItem(selected);
      setNameInput(selected.name);
      setShowSuggestions(false);
      setSelectedDeptId(selected.department?.id ? String(selected.department.id) : '');
      setTrackingMode(selected.trackingMode || 'Quantity');
      setFragile(selected.fragile ? 'true' : 'false');
      // Sync formsy name value
      formRef.current?.updateInputsWithValue({ name: selected.name });
   };

   const handleClearSelection = () => {
      setSelectedExistingItem(null);
      setNameInput('');
      setSelectedDeptId('');
      setFragile('false');
      setTrackingMode('Quantity');
      setStoreId('');
      formRef.current?.updateInputsWithValue({ name: '' });
      nameInputRef.current?.focus();
   };

   const departmentOptions = (allDepartmentsList ?? []).map((d: Department) => ({
      value: String(d.id),
      label: d.name,
   }));

   const fragileOptions = [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
   ];

   const trackingOptions = [
      { value: 'Quantity', label: 'Quantity Only' },
      { value: 'Serialized', label: 'Serialized (Track Individual Units)' },
   ];

   const storeOptions = (allStoresList ?? []).map((s: Store) => ({
      value: String(s.id),
      label: s.name,
   }));

   const handleSubmit = (data: ItemForm) => {
      data.name = nameInput.trim();
      data.fragile = fragile === 'true';
      data.actualQuantity = Number(data.actualQuantity);
      data.trackingMode = trackingMode;
      if (storeId) data.storeId = Number(storeId);

      // Edit mode — dispatch update, not create
      if (item?.id) {
         dispatch(itemActions.updateItemBasic({ ...data, id: item.id }) as unknown as UnknownAction);
         return;
      }

      // Adding units to an existing item
      if (selectedExistingItem) {
         const existingQty = Number(selectedExistingItem.actualQuantity ?? 0);
         const newTotal = existingQty + Number(data.actualQuantity);
         dispatch(
            itemActions.updateItemBasic({
               id: selectedExistingItem.id,
               name: selectedExistingItem.name,
               actualQuantity: newTotal,
               departmentId: selectedExistingItem.department?.id ?? 0,
               fragile: selectedExistingItem.fragile ?? false,
               trackingMode: selectedExistingItem.trackingMode,
               ...(storeId ? { storeId: Number(storeId) } : {}),
            }) as unknown as UnknownAction,
         );
         return;
      }

      data.departmentId = Number(selectedDeptId || userDetails?.departmentId || item?.department?.id);

      // Create mode — supports batch queue
      let updatedItems: ItemForm[] = [];

      if (editIndex !== null) {
         updatedItems = [...items];
         updatedItems[items.length] = data;
         setItems(updatedItems);
         setEditIndex(null);
      } else {
         updatedItems = [...items, data];
         setItems(updatedItems);
      }

      if (updatedItems.length === 1) {
         dispatch(itemActions.createItem(updatedItems[0]) as unknown as UnknownAction);
      } else if (updatedItems.length > 1) {
         dispatch(itemActions.createItems(updatedItems) as unknown as UnknownAction);
      }

      formRef.current?.reset();
      setNameInput('');
      setSelectedDeptId('');
      setFragile('false');
      setTrackingMode('Quantity');
      setStoreId('');
   };

   const handleDelete = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

   const handleEdit = (idx: number) => {
      const editItem = items[idx];
      setEditIndex(idx);
      setNameInput(editItem.name);
      formRef.current?.updateInputsWithValue({ name: editItem.name, actualQuantity: editItem.actualQuantity });
      const dep = allDepartmentsList.find((d: Department) => d.id === editItem.departmentId);
      if (dep) setSelectedDeptId(String(dep.id));
      setFragile(editItem.fragile ? 'true' : 'false');
      setItems((prev) => prev.filter((_, i) => i !== idx));
   };

   const addMoreItem = () => {
      if (!formRef.current) return;
      const formData: ItemForm = formRef.current.getModel();
      if (!nameInput.trim() || !formData.actualQuantity) {
         dispatch(
            appActions.setSnackBar({
               type: 'warning',
               message: 'Please fill in item name and quantity before adding another.',
               variant: 'warning',
            }) as unknown as UnknownAction,
         );
         return;
      }
      formData.name = nameInput.trim();
      formData.departmentId = Number(selectedDeptId || userDetails?.departmentId);
      formData.fragile = fragile === 'true';
      formData.actualQuantity = Number(formData.actualQuantity);
      formData.trackingMode = trackingMode;
      if (storeId) formData.storeId = Number(storeId);
      setItems((prev) => [...prev, formData]);
      formRef.current.reset();
      setNameInput('');
      setSelectedDeptId('');
      setFragile('false');
      setTrackingMode('Quantity');
      setStoreId('');
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(itemConstants.CREATE_ITEM_SUCCESS, (evt: Event) => {
         const newItem = evt as CustomEvent;
         if (newItem) {
            closeModal();
            if (userDetails?.roleId !== 3 && newItem.detail) {
               Router.push(`/admin/item/${newItem.detail.id}`);
            } else {
               dispatch(itemActions.getDepartmentItems({ departmentId: Number(userDetails.departmentId) }) as unknown as UnknownAction);
            }
         }
      });
      return () => listener.remove();
   }, [userDetails, dispatch, closeModal]);

   useEffect(() => {
      const listener = AppEmitter.addListener(itemConstants.CREATE_ITEMS_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) closeModal();
      });
      return () => listener.remove();
   }, [closeModal]);

   useEffect(() => {
      const listener = AppEmitter.addListener(itemConstants.UPDATE_ITEM_BASIC_SUCCESS, () => {
         closeModal();
         if (userDetails?.roleId !== 3) {
            dispatch(itemActions.getAllItems({ page: 1, limit: 10 }) as unknown as UnknownAction);
         } else {
            dispatch(itemActions.getDepartmentItems({ departmentId: Number(userDetails?.departmentId) }) as unknown as UnknownAction);
         }
      });
      return () => listener.remove();
   }, [closeModal, dispatch, userDetails]);

   const isAddUnitsMode = Boolean(selectedExistingItem);

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title={item ? 'Update Item' : 'Add New Item'}
            subtitle={item ? 'Update item details' : 'Add items to the facility inventory'}
            width="sm:w-[36rem]"
         >
            {/* Existing-item selection banner */}
            {isAddUnitsMode && (
               <div
                  className="flex items-center justify-between px-3 py-2 rounded-lg mb-4 text-xs"
                  style={{
                     background: 'var(--surface-info, #eff6ff)',
                     border: '1px solid var(--color-secondary)',
                     color: 'var(--color-secondary)',
                  }}
               >
                  <span className="font-medium">
                     Adding units to existing item: <span className="font-semibold">{selectedExistingItem?.name}</span>
                  </span>
                  <button
                     type="button"
                     onClick={handleClearSelection}
                     className="ml-3 font-semibold underline cursor-pointer"
                  >
                     Clear
                  </button>
               </div>
            )}

            {/* Queued items — only in create mode */}
            {!item && items.length > 0 && (
               <div className="mb-4 space-y-2 pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <p className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint)' }}>
                     Queued Items ({items.length})
                  </p>
                  {items.map((qItem, idx) => (
                     <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: 'var(--surface-low)', border: '1px solid var(--border-default)' }}
                     >
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{qItem.name}</span>
                        <div className="flex items-center gap-2">
                           <button
                              type="button"
                              onClick={() => handleEdit(idx)}
                              className="text-[0.65rem] font-medium cursor-pointer"
                              style={{ color: 'var(--color-secondary)' }}
                           >
                              Edit
                           </button>
                           <button
                              type="button"
                              onClick={() => handleDelete(idx)}
                              className="text-[0.65rem] font-medium text-red-500 cursor-pointer"
                           >
                              Remove
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-1.5"
            >
               {/* Row 1 — Name & Quantity */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {/* Searchable name input */}
                  <div className="my-3 w-full relative">
                     <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Item Name*
                     </label>
                     <input
                        ref={nameInputRef}
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                           setNameInput(e.target.value);
                           if (selectedExistingItem) setSelectedExistingItem(null);
                           setShowSuggestions(true);
                        }}
                        onFocus={() => {
                           if (!selectedExistingItem) setShowSuggestions(true);
                        }}
                        placeholder="Search or enter item name"
                        required
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                        style={{
                           background: 'var(--surface-low)',
                           border: '1px solid var(--border-default)',
                           color: 'var(--text-primary)',
                        }}
                        autoComplete="off"
                     />
                     {/* Suggestion dropdown */}
                     {showSuggestions && filteredSuggestions.length > 0 && (
                        <div
                           ref={suggestionsRef}
                           className="absolute z-50 left-0 right-0 mt-1 rounded-lg overflow-y-auto shadow-lg"
                           style={{
                              maxHeight: '12rem',
                              background: 'var(--surface-base, #fff)',
                              border: '1px solid var(--border-default)',
                           }}
                        >
                           {filteredSuggestions.map((suggestion: Item) => (
                              <button
                                 key={suggestion.id}
                                 type="button"
                                 onMouseDown={() => handleSelectExistingItem(suggestion)}
                                 className="w-full text-left px-3 py-2 flex flex-col hover:opacity-80 transition-opacity cursor-pointer"
                                 style={{ borderBottom: '1px solid var(--border-default)' }}
                              >
                                 <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {suggestion.name}
                                 </span>
                                 {suggestion.department?.name && (
                                    <span className="text-[0.65rem]" style={{ color: 'var(--text-hint)' }}>
                                       {suggestion.department.name}
                                    </span>
                                 )}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  <NumberInput
                     name="actualQuantity"
                     value={item?.actualQuantity}
                     label="Quantity"
                     placeholder={isAddUnitsMode ? 'Units to add' : 'Enter quantity'}
                     unitLabel="unit"
                     required
                  />
               </div>

               {/* Row 2 — Department & Tracking Mode */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {userDetails?.roleId !== 3 ? (
                     <SelectInput
                        name="departmentId"
                        label="Department"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={selectedDeptId}
                        onValueChange={(val) => {
                           if (!isAddUnitsMode) setSelectedDeptId(val);
                        }}
                        searchable
                        disabled={isAddUnitsMode}
                     />
                  ) : (
                     <div />
                  )}
                  <SelectInput
                     name="trackingMode"
                     label="Tracking Mode"
                     placeholder="Select tracking mode"
                     options={trackingOptions}
                     value={trackingMode}
                     onValueChange={(val) => {
                        if (!isAddUnitsMode) setTrackingMode(val);
                     }}
                     searchable={false}
                     disabled={isAddUnitsMode}
                  />
               </div>

               {/* Row 3 — Fragile & Store. Store only makes sense when creating/adding units
                   (applies to the new units). In update mode each unit has its own store,
                   edited per-row on the item detail page. */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <SelectInput
                     name="fragile"
                     label="Fragile"
                     placeholder="Is it fragile?"
                     options={fragileOptions}
                     value={fragile}
                     onValueChange={(val) => {
                        if (!isAddUnitsMode) setFragile(val);
                     }}
                     searchable={false}
                     disabled={isAddUnitsMode}
                  />
                  {!item?.id && (
                     <SelectInput
                        name="storeId"
                        label="Store"
                        placeholder="Select store (optional)"
                        options={storeOptions}
                        value={storeId}
                        onValueChange={(val) => setStoreId(val)}
                        searchable
                     />
                  )}
               </div>

               {/* Add more button — only in new-item create mode */}
               {!item && !isAddUnitsMode && (
                  <button
                     type="button"
                     onClick={addMoreItem}
                     className="w-full py-2 mt-1 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                     style={{
                        background: 'var(--surface-low)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                     }}
                  >
                     + Add another item
                  </button>
               )}

               {/* Submit */}
               <div className="flex justify-end pt-3 mt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit || !nameInput.trim()}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingItem ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : editIndex !== null || item ? (
                        'Update Item'
                     ) : isAddUnitsMode ? (
                        'Add Units'
                     ) : (
                        'Add Item'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddItem;
