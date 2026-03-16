import React, { ReactNode, useCallback, useEffect, useState } from 'react';
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
   const { departmentItemsList } = useSelector((s: RootState) => s.item);
   const { userDetails } = useSelector((s: RootState) => s.user);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedItemId, setSelectedItemId] = useState<string>(
      maintenanceData?.servicedItem ? String(maintenanceData.servicedItem) : '',
   );

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (onClose) onClose();
   }, [onClose]);

   useEffect(() => {
      dispatch(itemActions.getDepartmentItems({ departmentId: 1 }) as unknown as UnknownAction);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const itemOptions = (departmentItemsList ?? []).map((item) => ({
      value: String(item.id),
      label: item.name,
   }));

   const handleSubmit = (data: MaintenanceForm) => {
      data.servicedItem = selectedItemId;
      data.costOfMaintenance = Number(data.costOfMaintenance);
      data.signature = `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim();

      dispatch(maintenanceActions.createMaintenanceLog(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(
         maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
         (evt: Event) => {
            if (evt as CustomEvent) {
               setIsModalOpen(false);
            }
         },
      );
      return () => listener.remove();
   }, []);

   const isOpen = open || isModalOpen;

   return (
      <>
         <button className={className} onClick={openModal}>
            {children}
         </button>

         <ModalWrapper
            open={isOpen}
            onClose={closeModal}
            title={maintenanceData ? 'Update Maintenance Log' : 'New Maintenance Log'}
            subtitle="Record a maintenance activity"
            width="sm:w-[36rem]"
         >
            <Formsy
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
            >
               {/* Row 1 — Item & Date */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <SelectInput
                     name="servicedItem"
                     label="Item to be Serviced"
                     placeholder="Select an item"
                     options={itemOptions}
                     value={selectedItemId}
                     onValueChange={(val) => setSelectedItemId(val)}
                     required
                  />
                  <DateInput
                     name="maintenanceDate"
                     label="Maintenance Date"
                     placeholder="Select date"
                     value={maintenanceData?.maintenanceDate || ''}
                     mode="date"
                  />
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
                     disabled={!canSubmit}
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
