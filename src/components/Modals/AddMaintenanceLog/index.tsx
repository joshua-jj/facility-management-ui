import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import CurrencyInput from '@/components/Inputs/CurrencyInput';
import DateInput from '@/components/Inputs/DateInput';
import SelectInput from '@/components/Inputs/SelectInput';
import TextArea from '@/components/Inputs/TextArea';
import PhoneInput from '@/components/Inputs/PhoneInput';
import ModalWrapper from '../ModalWrapper';
import { MaintenanceForm, MaintenanceLog } from '@/types';
import { itemActions, maintenanceActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { maintenanceConstants } from '@/constants';

interface AddItemModalProps {
   children?: ReactNode;
   className: string;
   open?: boolean;
   onClose?: () => void;
   maintenanceData?: MaintenanceLog | null;
}

const AddMaintenanceLog: React.FC<AddItemModalProps> = ({
   className,
   children,
   open,
   onClose,
   maintenanceData,
}) => {
   const dispatch = useDispatch();
   const { IsCreatingMaintenanceLog } = useSelector((s: RootState) => s.maintenance);
   const { allItemsList, IsRequestingAllItems, pagination } = useSelector(
      (s: RootState) => s.item,
   );
   const { userDetails } = useSelector((s: RootState) => s.user);

   // Infinite-scroll + server-side search state for the item dropdown.
   // The combo-box fires onLoadMore when the user scrolls within 40px
   // of the list bottom; we increment page and re-dispatch with
   // append=true so the reducer concatenates instead of replacing.
   // Search keystrokes are debounced and reset pagination — laptop
   // users typing to filter should never have to scroll past pages
   // they don't care about.
   const ITEMS_PAGE_SIZE = 50;
   const SEARCH_DEBOUNCE_MS = 250;
   const [itemsPage, setItemsPage] = React.useState(1);
   const [itemsSearch, setItemsSearch] = React.useState('');
   const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const itemsMeta = pagination?.meta;
   const hasMoreItems = itemsMeta
      ? Number(itemsMeta.currentPage ?? 0) <
        Number(itemsMeta.totalPages ?? 0)
      : false;

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItemId, setSelectedItemId] = useState<string>(
      maintenanceData?.servicedItem ? String(maintenanceData.servicedItem) : '',
   );
   const [maintenanceDate, setMaintenanceDate] = useState<string>(
      maintenanceData?.maintenanceDate || '',
   );
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const dateError = (() => {
      if (!maintenanceDate) return null;
      const picked = new Date(maintenanceDate).getTime();
      if (!Number.isFinite(picked)) return null;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (picked > endOfToday.getTime()) return 'Maintenance Date cannot be in the future.';
      return null;
   })();

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (!maintenanceData) {
         setSelectedItemId('');
         setMaintenanceDate('');
         formRef.current?.reset();
      }
      if (onClose) onClose();
   }, [onClose, maintenanceData]);

   useEffect(() => {
      // First page on mount. Subsequent pages are loaded by the combo
      // box's onLoadMore callback (handleLoadMore below). The reducer
      // replaces on the first call (append unset) and concatenates on
      // every later one (append=true), so the dropdown grows.
      dispatch(
         itemActions.getAllItems({
            page: 1,
            limit: ITEMS_PAGE_SIZE,
         }) as unknown as UnknownAction,
      );
      setItemsPage(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const handleLoadMore = useCallback(() => {
      if (IsRequestingAllItems || !hasMoreItems) return;
      const nextPage = itemsPage + 1;
      setItemsPage(nextPage);
      dispatch(
         itemActions.getAllItems({
            page: nextPage,
            limit: ITEMS_PAGE_SIZE,
            search: itemsSearch || undefined,
            append: true,
         }) as unknown as UnknownAction,
      );
   }, [dispatch, IsRequestingAllItems, hasMoreItems, itemsPage, itemsSearch]);

   const handleSearchChange = useCallback(
      (next: string) => {
         setItemsSearch(next);
         // Debounce: don't fire one HTTP request per keystroke. The
         // 250ms window matches typical typing cadence and feels
         // instant on a laptop while still being cheap.
         if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
         }
         searchDebounceRef.current = setTimeout(() => {
            setItemsPage(1);
            dispatch(
               itemActions.getAllItems({
                  page: 1,
                  limit: ITEMS_PAGE_SIZE,
                  search: next || undefined,
               }) as unknown as UnknownAction,
            );
         }, SEARCH_DEBOUNCE_MS);
      },
      [dispatch],
   );

   useEffect(() => {
      return () => {
         if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      };
   }, []);

   const itemOptions = (allItemsList ?? []).map((item) => ({
      value: String(item.id),
      label: item.name,
   }));

   const handleSubmit = (data: MaintenanceForm) => {
      data.servicedItem = selectedItemId;
      data.maintenanceDate = maintenanceDate;
      data.costOfMaintenance = Number(data.costOfMaintenance);
      data.signature = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();

      if (maintenanceData?.id) {
         dispatch(
            maintenanceActions.updateMaintenanceLog({
               ...data,
               id: maintenanceData.id,
            }) as unknown as UnknownAction,
         );
      } else {
         dispatch(maintenanceActions.createMaintenanceLog(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(
         maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
         () => {
            closeModal();
         },
      );
      return () => listener.remove();
   }, [closeModal]);

   const isOpen = open || isModalOpen;

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={isOpen}
            onClose={closeModal}
            title={maintenanceData ? 'Update Maintenance Log' : 'New Maintenance Log'}
            subtitle="Record a maintenance activity"
            width="sm:w-[36rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               {/* Row 1 — Item & Date */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {maintenanceData ? (
                     // Locked on update — the log is already mapped to this
                     // item and the recipient HOD has already been notified.
                     // Show a read-only field so users can see what they're
                     // editing without any affordance suggesting they can change it.
                     <div className="mb-4">
                        <label className="block text-xs uppercase tracking-wide text-[var(--text-secondary)] mb-1">
                           Item to be Serviced
                        </label>
                        <div className="px-3 py-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-low)] text-sm text-[var(--text-primary)]">
                           {itemOptions.find((o) => o.value === selectedItemId)?.label
                              ?? maintenanceData?.serviceItemName
                              ?? '—'}
                        </div>
                     </div>
                  ) : (
                     <SelectInput
                        name="servicedItem"
                        label="Item to be Serviced"
                        placeholder="Select an item"
                        options={itemOptions}
                        value={selectedItemId}
                        onValueChange={(val) => setSelectedItemId(val)}
                        required
                        onLoadMore={handleLoadMore}
                        hasMore={hasMoreItems}
                        isLoading={IsRequestingAllItems}
                        loadingText="Loading more items…"
                        onSearchChange={handleSearchChange}
                     />
                  )}
                  <div>
                     <DateInput
                        name="maintenanceDate"
                        label="Maintenance Date"
                        placeholder="Select date"
                        value={maintenanceDate}
                        onValueChange={(val: string) => setMaintenanceDate(val)}
                        required
                        mode="date"
                        maxDate={new Date().toISOString().split('T')[0]}
                     />
                     {dateError && (
                        <p className="text-red-500 text-xs -mt-1">{dateError}</p>
                     )}
                  </div>
               </div>

               {/* Row 2 — Cost */}
               <CurrencyInput
                  name="costOfMaintenance"
                  label="Cost of Maintenance"
                  placeholder="20,000"
                  value={String(maintenanceData?.costOfMaintenance) || ''}
                  required
                  defaultCurrency="NGN"
               />

               {/* Row 3 — Artisan info */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <TextInput
                     type="text"
                     name="artisanName"
                     label="Artisan Name"
                     placeholder="Enter name"
                     value={maintenanceData?.artisanName || ''}
                     required
                  />
                  <PhoneInput
                     name="artisanPhone"
                     label="Artisan Phone"
                     value={maintenanceData?.artisanPhone || ''}
                     required
                     defaultCountry="NG"
                     outputFormat="raw"
                  />
               </div>

               {/* Row 4 — Description */}
               <TextArea
                  type="text"
                  name="description"
                  label="Description"
                  placeholder="Describe the maintenance work performed"
                  value={maintenanceData?.description || ''}
                  required
                  rows={3}
               />

               {/* Submit */}
               <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2.5 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit || !!dateError}
                     type="submit"
                     className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingMaintenanceLog ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : maintenanceData ? (
                        'Update Log'
                     ) : (
                        'Create Log'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddMaintenanceLog;
