import React, { useState } from 'react';
import { CaretIcon, DeleteIcon, SearchIcon } from '../Icons';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
// import { Department } from '@/redux/reducers/department.reducer';
import { itemActions } from '@/actions';
import { Items } from '@/redux/reducers/item.reducer';
import { Department } from '@/types';

interface ItemDetailsProps {
  items: Items[];
  department: Department | null;
  setItems: (items: Items[]) => void;
  //   setDepartment: React.Dispatch<React.SetStateAction<Department | null>>;
  setDepartment: (department: Department | null) => void;
  addItem: () => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({
  items,
  department,
  setItems,
  setDepartment,
  addItem,
}) => {
  const dispatch = useDispatch();
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { allDepartmentItemsList } = useSelector((s: RootState) => s.item);

  const [search, setSearch] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  //   const [department, setDepartment] = useState<Department | null>(null);

  const handleDepartmentSelect = (department: Department) => {
    setDepartment(department);
    dispatch(
      itemActions.getDepartmentItems(department.id) as unknown as UnknownAction
    );
    setDepartmentIsOpen(false);
  };

  const handleSelect = (item: Items, selectedItem: Items) => {
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
        : i
    );
    setItems(updatedItems);
    setOpenDropdownId(null);
  };

  const handleQuantityChange = (item: Items, delta: number) => {
    const updatedItems = items.map((i) => {
      if (i.id === item.id) {
        const requestedQuantity = (i.requestedQuantity || 0) + delta;
        return {
          ...i,
          requestedQuantity: Math.max(
            1,
            Math.min(requestedQuantity, i.availableQuantity || 0)
          ),
        };
      }
      return i;
    });
    setItems(updatedItems);
  };

  const handleDelete = (item: Items) => {
    const updatedItems = items.filter((obj) => obj.id !== item.id);
    const reindexedItems = updatedItems.map((obj, index) => ({
      ...obj,
      id: index + 1,
    }));
    setItems(reindexedItems);
    setOpenDropdownId(null);
  };

  const filteredDepartments = allDepartmentsList.filter((department) =>
    department.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredItems = allDepartmentItemsList.filter((item: Items) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 group">
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
      {allDepartmentItemsList?.length > 0 &&
        items?.map((item) => (
          <div key={item.id} className="mb-6 group">
            <div className="flex justify-between items-center">
              <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                Item {item.id} name
              </label>
              <button
                onClick={() => handleDelete(item)}
                className="flex items-center font-medium text-[0.8rem] text-[#D32F2F] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
              >
                <DeleteIcon className="mr-1" /> Delete
              </button>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdownId(openDropdownId === item.id ? null : item.id)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
              >
                {item.name || 'Select item'}
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                  <CaretIcon className="rotate-90" />
                </span>
              </button>

              {openDropdownId === item.id && (
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
                    {filteredItems.map((availableItem) => (
                      <li
                        key={availableItem.name}
                        onClick={() => handleSelect(item, availableItem)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      >
                        <span className="mr-4">
                          {availableItem.name} (
                          {availableItem.availableQuantity})
                        </span>
                        <span
                          className={`text-[0.65rem] p-1 rounded ${
                            availableItem.availableQuantity > 0
                              ? 'text-[#00A35C] bg-[rgba(0, 163, 92, 0.1)]'
                              : 'text-[#D32F2F] bg-[rgba(211, 47, 47, 0.1)]'
                          }`}
                        >
                          {availableItem.availableQuantity > 0
                            ? 'Available'
                            : 'Unavailable'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {item.name && (
              <div className="mt-2 text-sm text-gray-600">
                Available Quantity: {item.availableQuantity}
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
              Requested Quantity
            </label>
            <div className="flex items-center text-[#0F2552] gap-4">
              <button
                onClick={() => handleQuantityChange(item, -1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-l"
                disabled={(item.requestedQuantity || 0) <= 1}
              >
                -
              </button>
              <div className="w-6/10 h-10 border border-gray-300 flex items-center justify-center">
                <input
                  type="text"
                  value={item.requestedQuantity || 0}
                  readOnly
                  className="w-full text-center border-none focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleQuantityChange(item, 1)}
                className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-r"
                disabled={
                  (item.requestedQuantity || 0) >= (item.availableQuantity || 0)
                }
              >
                +
              </button>
            </div>
          </div>
        ))}
      {allDepartmentItemsList?.length > 0 && (
        <button
          onClick={addItem}
          className="w-full h-12 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Add more item
        </button>
      )}
    </div>
  );
};

export default ItemDetails;
