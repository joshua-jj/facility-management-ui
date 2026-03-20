import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SuccessModal from '../Report/SuccessModal';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { RootState } from '@/redux/reducers';
import { useDispatch, useSelector } from 'react-redux';
import { Department, Item, ItemForm } from '@/types';
import { departmentActions, itemActions, storeActions } from '@/actions';
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

const AddItem: React.FC<AddItemModalProps> = ({
  className,
  children,
  item,
  onClose,
  open,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingItem } = useSelector((s: RootState) => s.item);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { allStoresList } = useSelector((s: RootState) => s.store);
  const { userDetails } = useSelector((s: RootState) => s.user);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [fragile, setFragile] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  const [fragileIsOpen, setFragileIsOpen] = useState(false);

  // Track multiple items
  const [items, setItems] = useState<ItemForm[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null); // track item being edited

  const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

  const openModal = () => setIsModalOpen(true);
  //   const closeModal = () => {
  //   setIsModalOpen(false);
  //   if (onClose) onClose();
  // };
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (onClose) onClose();
  }, [onClose]);
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

  const handleDepartmentSelect = (department: Department) => {
    setDepartment(department);
    setDepartmentIsOpen(false);
  };

  console.log('item', item);

  const handleSubmit = (data: ItemForm) => {
    data.departmentId = Number(
      department?.id || userDetails?.departmentId || item?.department?.id
    );
    data.fragile = fragile;
    data.actualQuantity = Number(data.actualQuantity);

    let updatedItems: ItemForm[] = [];

    if (editIndex !== null) {
      // Update existing
      updatedItems = [...items];
      updatedItems[items.length] = data;
      // updatedItems[editIndex] = data;
      setItems(updatedItems);
      setEditIndex(null);
    } else {
      // New item
      updatedItems = [...items, data];
      setItems(updatedItems);
    }

    if (item?.id) {
      data.id = item?.id;
      // Update existing item
      dispatch(itemActions.createItem(data) as unknown as UnknownAction);
    }

    // Dispatch based on item count
    if (updatedItems.length === 1) {
      // Single item → call createItem
      dispatch(
        itemActions.createItem(updatedItems[0]) as unknown as UnknownAction
      );
    } else if (updatedItems.length > 1) {
      // Multiple items → call createItems
      dispatch(
        itemActions.createItems(updatedItems) as unknown as UnknownAction
      );
    }

    // Reset form
    formRef.current?.reset();
    setDepartment(null);
    setFragile(false);
  };

  const handleDelete = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    const item = items[idx];
    setEditIndex(idx);

    // preload form
    formRef.current?.updateInputsWithValue({
      name: item.name,
      actualQuantity: item.actualQuantity,
    });

    const dep = allDepartmentsList.find((d) => d.id === item.departmentId);
    if (dep) setDepartment(dep);
    setFragile(item.fragile);
    setItems((prev) => prev.filter((_, i) => i !== idx));
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
          if (userDetails?.roleId !== 3 && newItem.detail) {
            Router.push(`/admin/item/${newItem.detail.id}`);
          } else {
            dispatch(
              itemActions.getDepartmentItems({
                departmentId: Number(userDetails.departmentId),
              }) as unknown as UnknownAction
            );
          }
        }
      }
    );

    return () => listener.remove();
  }, [userDetails, dispatch, closeModal]);

  useEffect(() => {
    const listener = AppEmitter.addListener(
      itemConstants.CREATE_ITEMS_SUCCESS,
      (evt: Event) => {
        const newItem = evt as CustomEvent;
        console.log('New item created:', newItem);
        console.log('New item details created:', newItem.detail);
        if (newItem) {
          closeModal();
        }
      }
    );

    return () => listener.remove();
  }, [closeModal]);

  const addMoreItem = () => {
    if (formRef.current) {
      const formData: ItemForm = formRef.current.getModel();

      if (!formData.name) return; // avoid adding empty

      formData.departmentId = Number(
        department?.id || userDetails?.departmentId
      );
      formData.fragile = fragile;
      formData.actualQuantity = Number(formData.actualQuantity);

      // Save to list
      setItems((prev) => [...prev, formData]);

      // Reset form
      formRef.current.reset();
      setDepartment(null);
      setFragile(false);
    }
  };

  const filteredDepartments = allDepartmentsList.filter((department) =>
    department.name.toLowerCase().includes(search.toLowerCase())
  );

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
            {item ? 'Update' : 'Add new'} item
          </h2>

          {/* Show added items above form */}
          {items.length > 0 && (
            <div className="mb-4 space-y-2 border-b border-gray-200 pb-4">
              {items.map((item, idx) => (
                <div key={idx} className=" overflow-hidden">
                  <p className="font-medium text-[15px] text-[#0F2552]">
                    Item Title
                  </p>
                  <div className="rounded flex justify-between items-center bg-[#0F255233] border border-[#0F255226] px-4 py-2">
                    <span className="font-medium text-[#0F2552]">
                      {item.name}
                    </span>
                    <div className="flex items-center space-x-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleEdit(idx)}
                        className="flex items-center cursor-pointer text-[13px] font-medium text-[#0F2552] hover:text-blue-600"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="flex items-center cursor-pointer text-[13px] font-medium text-[#D32F2F] hover:text-red-700"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Formsy
            ref={formRef}
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="name"
              value={item?.name}
              label="Item name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />

            {/* Department */}
            {userDetails?.roleId !== 3 && (
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
                    {department?.name ||
                      item?.department?.name ||
                      'Select department'}
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
            )}

            <TextInput
              type="number"
              name="actualQuantity"
              value={item?.actualQuantity}
              label="Item quantity"
              placeholder="Enter quantity"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            {/* {item && (
              <TextInput
                type="number"
                name="availableQuantity"
                value={String(item?.availableQuantity)}
                label="Available quantity"
                placeholder="Enter quantity"
                required
                className="text-[#0F2552] rounded font-medium text-sm"
                inputClass="font-normal border border-gray-300 rounded"
              />
            )} */}

            {/* Fragile */}
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
                  {fragile || item?.fragile ? 'yes' : 'no'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {fragileIsOpen && (
                  <ul className="absolute w-full max-h-40 overflow-y-auto mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <li
                      onClick={() => {
                        setFragile(true);
                        setFragileIsOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">yes</span>
                    </li>
                    <li
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
            {!item && (
              <div
                onClick={addMoreItem}
                className="w-full h-12 py-2 flex items-center justify-center bg-[#E5E8EC] cursor-pointer border border-[#ACB1BA4D] text-[#0F2552] font-medium text-sm rounded hover:bg-gray-200"
              >
                + Add more item
              </div>
            )}
            {/* Final submit */}
            <button
              disabled={!canSubmit}
              className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              {IsCreatingItem ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : editIndex !== null || item ? (
                'Update item'
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
