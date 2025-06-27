import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SuccessModal from '../Report/SuccessModal';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { RootState } from '@/redux/reducers';
import { useDispatch, useSelector } from 'react-redux';
import { Department, ItemForm } from '@/types';
import { departmentActions, itemActions, storeActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { itemConstants } from '@/constants';
import Router from 'next/router';

interface AddItemModalProps {
  // onClose: () => void;
  children: ReactNode;
  className: string;
  // open: boolean;
}

const AddItem: React.FC<AddItemModalProps> = ({
  className,
  children,
  // onClose,
  // open,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingItem } = useSelector((s: RootState) => s.item);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { allStoresList } = useSelector((s: RootState) => s.store);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  // const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  // const [store, setStore] = useState<Store | null>(null);
  const [fragile, setFragile] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  // const [storeIsOpen, setStoreIsOpen] = useState(false);
  const [fragileIsOpen, setFragileIsOpen] = useState(false);
  // const [conditionIsOpen, setConditionIsOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  useEffect(() => {
    if (allDepartmentsList?.length === 0) {
      dispatch(
        departmentActions.getAllDepartments() as unknown as UnknownAction
      );
    }
    if (allStoresList?.length === 0) {
      dispatch(storeActions.getStores() as unknown as UnknownAction);
    }
  }, [dispatch, allDepartmentsList, allStoresList]);

  const handleSubmit = (data: ItemForm) => {
    if (!department) {
      alert('Please select a department');
      return;
    }
    data.fragile = fragile;
    // data.storeId = store?.id;
    data.departmentId = department?.id;
    // data.condition = 'Not specified';
    data.actualQuantity = Number(data.actualQuantity);

    dispatch(itemActions.createItem(data) as unknown as UnknownAction);

    setDepartment(null);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      itemConstants.CREATE_ITEM_SUCCESS,
      (evt: Event) => {
        const newItem = evt as CustomEvent;
        console.log('New item created:', newItem);
        console.log('New item details created:', newItem.detail);
        if (newItem) {
          closeModal();
          Router.push(`/admin/item/${newItem.detail.id}`);
          // setIsSuccessOpen(true);
        }
      }
    );

    return () => listener.remove();
  }, []);

  const handleDepartmentSelect = (department: Department) => {
    setDepartment(department);
    setDepartmentIsOpen(false);
  };

  // const handleStoreSelect = (store: Store) => {
  //   setStore(store);
  //   setStoreIsOpen(false);
  // };

  const filteredDepartments = allDepartmentsList.filter((department) =>
    department.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Add new item
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="name"
              label="Item name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Department
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDepartmentIsOpen(!departmentIsOpen)}
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
                      {filteredDepartments.map((department) => (
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
            </div>

            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Store
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStoreIsOpen(!storeIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {store?.name || 'Select store'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {storeIsOpen && (
                  <ul className="absolute w-full max-h-40 overflow-y-auto mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    {allStoresList.map((store) => (
                      <li
                        key={store.id}
                        onClick={() => handleStoreSelect(store)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      >
                        <span className="mr-4">{store.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div> */}

            <TextInput
              type="number"
              name="actualQuantity"
              label="Item quantity"
              placeholder="Enter quantity"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Fragile
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFragileIsOpen(!fragileIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {fragile ? 'yes' : 'no'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {fragileIsOpen && (
                  <ul className="absolute w-full max-h-40 overflow-y-auto mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <li
                      // onClick={() => setFragile(true)}
                      onClick={() => {
                        setFragile(true);
                        setFragileIsOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">yes</span>
                    </li>
                    <li
                      // onClick={() => setFragile(false)}
                      onClick={() => {
                        setFragile(false);
                        setFragileIsOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">no</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Item Condition
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setConditionIsOpen(!conditionIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {department?.name || 'Select condition'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {conditionIsOpen && (
                  <ul className="absolute w-full max-h-40 overflow-y-auto mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <li
                      // onClick={() => handleDepartmentSelect(department)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">good</span>
                    </li>
                    <li
                      // onClick={() => handleDepartmentSelect(department)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">bad</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Quantity
            </label>
            <div className="flex items-center text-[#0F2552] gap-4 mb-6">
              <button
                // onClick={() => handleQuantityChange(item, -1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-l"
                // disabled={(item.requestedQuantity || 0) <= 1}
              >
                -
              </button>
              <div className="w-6/10 h-10 border border-gray-300 flex items-center justify-center">
                <input
                  type="text"
                  // value={item.requestedQuantity || 0}
                  readOnly
                  className="w-full text-center border-none focus:outline-none"
                />
              </div>
              <button
                // onClick={() => handleQuantityChange(item, 1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-r"
                // disabled={
                // (item.requestedQuantity || 0) >= (item.availableQuantity || 0)
                // }
              >
                +
              </button>
            </div>

            <button
              // onClick={addItem}
              className="w-full h-12 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Add more item
            </button> */}

            <button
              // onClick={handleSubmit}
              // disabled={!canSubmit() || IsCreatingRequest}
              disabled={!canSubmit}
              className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              {IsCreatingItem ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Add item'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
      <SuccessModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        autoCloseDelay={5000}
      />
    </>
  );
};

export default AddItem;
