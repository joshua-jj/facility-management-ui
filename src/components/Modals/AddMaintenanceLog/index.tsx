import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
// import SuccessModal from '../Report/SuccessModal';
import { Item, MaintenanceForm, MaintenanceLog } from '@/types';
import { itemActions, maintenanceActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { AppEmitter } from '@/controllers/EventEmitter';
import { maintenanceConstants } from '@/constants';
import TextArea from '@/components/Inputs/TextArea';
// import { setItem } from 'localforage';

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
  const { IsCreatingMaintenanceLog } = useSelector(
    (s: RootState) => s.maintenance
  );
  // const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { departmentItemsList } = useSelector((s: RootState) => s.item);
  const { userDetails } = useSelector((s: RootState) => s.user);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemIsOpen, setItemIsOpen] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');

  const openModal = () => setIsModalOpen(true);
  // const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    dispatch(
      itemActions.getDepartmentItems({
        departmentId: 1,
      }) as unknown as UnknownAction
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentItemsArray = departmentItemsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const handleItemSelect = (item: Item) => {
    setItem(item);
    setItemIsOpen(false);
  };

  const handleSubmit = (data: MaintenanceForm) => {
    data.servicedItem = String(item?.id);
    data.costOfMaintenance = Number(data.costOfMaintenance);
    data.signature = userDetails?.firstName + ' ' + userDetails?.lastName;

    dispatch(
      maintenanceActions.createMaintenanceLog(data) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      maintenanceConstants.CREATE_MAINTENANCE_LOG_SUCCESS,
      (evt: Event) => {
        const newUser = evt as CustomEvent;

        if (newUser) {
          setIsModalOpen(false);
        }
      }
    );

    return () => listener.remove();
  }, []);

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Maintenance log
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Item to be serviced
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setItemIsOpen(!itemIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {item?.name ||
                    String(maintenanceData?.serviceItemName) ||
                    'Select item'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {itemIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {departmentItemsArray.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <TextInput
              type="date"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="maintenanceDate"
              label="Maintenance Date"
              placeholder="select option"
              inputClass="font-normal border border-gray-300 rounded"
              value={maintenanceData?.maintenanceDate || ''}
            />
            <TextInput
              type="number"
              name="costOfMaintenance"
              label="Cost of Maintenance"
              placeholder="#20,000"
              value={String(maintenanceData?.costOfMaintenance) || ''}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="artisanName"
              label="Artisan Name"
              placeholder="Enter name"
              value={maintenanceData?.artisanName || ''}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="artisanPhone"
              label="Artisan Phone"
              placeholder="Enter phone number"
              value={maintenanceData?.artisanPhone || ''}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />

            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Did you notice any fault?
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setItemIsOpen(!departmentIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {item?.name || 'Select Item'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {departmentIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {allDepartmentItemsArray.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div> */}
            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Due for service?
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setItemIsOpen(!departmentIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {department?.name || 'Select department'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {departmentIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {allDepartmentsArray.map((department) => (
                        <li
                          key={department.id}
                          onClick={() => handleDepartmentSelect(department)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{department.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div> */}
            <TextArea
              type="text"
              name="description"
              label="Description"
              placeholder="Add details"
              value={maintenanceData?.description || ''}
              required
            />
            <button
              //   onClick={handleSubmit}
              // disabled={!canSubmit() || IsCreatingRequest}
              disabled={!canSubmit}
              //   className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsCreatingMaintenanceLog ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : maintenanceData ? (
                'Update'
              ) : (
                'Submit'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default AddMaintenanceLog;
