import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SelectInput from '@/components/Inputs/SelectInput';
import ModalWrapper from '../ModalWrapper';
import { RootState } from '@/redux/reducers';
import { useDispatch, useSelector } from 'react-redux';
import { Department, Item, ItemForm } from '@/types';
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
   const { IsCreatingItem } = useSelector((s: RootState) => s.item);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allStoresList } = useSelector((s: RootState) => s.store);
   const { userDetails } = useSelector((s: RootState) => s.user);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedDeptId, setSelectedDeptId] = useState<string>(
      item?.department?.id ? String(item.department.id) : '',
   );
   const [fragile, setFragile] = useState(item?.fragile ? 'true' : 'false');
   const [items, setItems] = useState<ItemForm[]>([]);
   const [editIndex, setEditIndex] = useState<number | null>(null);
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

   const departmentOptions = (allDepartmentsList ?? []).map((d: Department) => ({
      value: String(d.id),
      label: d.name,
   }));

   const fragileOptions = [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
   ];

   const handleSubmit = (data: ItemForm) => {
      data.departmentId = Number(selectedDeptId || userDetails?.departmentId || item?.department?.id);
      data.fragile = fragile === 'true';
      data.actualQuantity = Number(data.actualQuantity);

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

      if (item?.id) {
         data.id = item.id;
         dispatch(itemActions.createItem(data) as unknown as UnknownAction);
      } else if (updatedItems.length === 1) {
         dispatch(itemActions.createItem(updatedItems[0]) as unknown as UnknownAction);
      } else if (updatedItems.length > 1) {
         dispatch(itemActions.createItems(updatedItems) as unknown as UnknownAction);
      }

      formRef.current?.reset();
      setSelectedDeptId('');
      setFragile('false');
   };

   const handleDelete = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

   const handleEdit = (idx: number) => {
      const editItem = items[idx];
      setEditIndex(idx);
      formRef.current?.updateInputsWithValue({ name: editItem.name, actualQuantity: editItem.actualQuantity });
      const dep = allDepartmentsList.find((d: Department) => d.id === editItem.departmentId);
      if (dep) setSelectedDeptId(String(dep.id));
      setFragile(editItem.fragile ? 'true' : 'false');
      setItems((prev) => prev.filter((_, i) => i !== idx));
   };

   const addMoreItem = () => {
      if (!formRef.current) return;
      const formData: ItemForm = formRef.current.getModel();
      if (!formData.name || !formData.actualQuantity) {
         dispatch(
            appActions.setSnackBar({
               type: 'warning',
               message: 'Please fill in item name and quantity before adding another.',
               variant: 'warning',
            }) as unknown as UnknownAction,
         );
         return;
      }
      formData.departmentId = Number(selectedDeptId || userDetails?.departmentId);
      formData.fragile = fragile === 'true';
      formData.actualQuantity = Number(formData.actualQuantity);
      setItems((prev) => [...prev, formData]);
      formRef.current.reset();
      setSelectedDeptId('');
      setFragile('false');
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

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <ModalWrapper
            open={open || isModalOpen}
            onClose={closeModal}
            title={item ? 'Update Item' : 'Add New Item'}
            subtitle="Add items to the facility inventory"
            width="sm:w-[36rem]"
         >
            {/* Queued items */}
            {items.length > 0 && (
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
                  <TextInput
                     type="text"
                     name="name"
                     value={item?.name}
                     label="Item Name"
                     placeholder="Enter item name"
                     required
                  />
                  <TextInput
                     type="number"
                     name="actualQuantity"
                     value={item?.actualQuantity}
                     label="Quantity"
                     placeholder="Enter quantity"
                     required
                  />
               </div>

               {/* Row 2 — Department & Fragile */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {userDetails?.roleId !== 3 ? (
                     <SelectInput
                        name="departmentId"
                        label="Department"
                        placeholder="Select department"
                        options={departmentOptions}
                        value={selectedDeptId}
                        onValueChange={(val) => setSelectedDeptId(val)}
                        searchable
                     />
                  ) : (
                     <div />
                  )}
                  <SelectInput
                     name="fragile"
                     label="Fragile"
                     placeholder="Is it fragile?"
                     options={fragileOptions}
                     value={fragile}
                     onValueChange={(val) => setFragile(val)}
                     searchable={false}
                  />
               </div>

               {/* Add more button */}
               {!item && (
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
                     disabled={!canSubmit}
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
