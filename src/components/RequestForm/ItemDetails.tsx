// components/ItemDetails.tsx
'use client';

import React, { useState } from 'react';
import { CaretIcon, DeleteIcon, SearchIcon } from '../Icons';

interface Item {
  id: number;
  name: string;
  quantity: number;
}

interface ItemDetailsProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  addItem: () => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ items, setItems, addItem }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const availableItems = [
    { name: 'Generator', available: true, total: 3 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
    { name: 'Microphone', available: false, total: 0 },
  ];

  const handleSelect = (item: Item, selectedName: string) => {
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, name: selectedName } : i
    );
    setItems(updatedItems);
    setIsOpen(false);
  };

  const handleQuantityChange = (item: Item, delta: number) => {
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    );
    setItems(updatedItems);
  };

  const filteredItems = availableItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (item: Item) => {
    items.filter((obj) => obj.id !== item.id);
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="mb-6 group">
          <div className="flex justify-between items-center">
            {/* Item Name */}
            <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
              Item {item.id} name
            </label>
            {/*  */}
            <button onClick={() => handleDelete(item)} className="flex items-center font-medium text-[0.8rem] text-[#D32F2F] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
              <DeleteIcon className="mr-1" /> Delete
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
            >
              {item.name || 'Select item'}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                <CaretIcon className="rotate-90" />
              </span>
            </button>

            {isOpen && (
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
                      onClick={() => handleSelect(item, availableItem.name)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    >
                      <span className="mr-4">{availableItem.name}({availableItem.total})</span>
                      <span
                        className={`text-[0.65rem] p-1 rounded ${
                          availableItem.available ? 'text-[#00A35C] bg-[rgba(0, 163, 92, 0.1)]' : 'text-[#D32F2F] bg-[rgba(211, 47, 47, 0.1)]'
                        }`}
                      >
                        {availableItem.available ? 'Available' : 'Unavailable'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quantity */}
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
            Quantity
          </label>
          <div className="flex items-center text-[#0F2552] gap-4">
            <button
              onClick={() => handleQuantityChange(item, -1)}
              className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-l"
            >
              -
            </button>
            <div className="w-6/10 h-10 border border-gray-300">
              <input
                type="text"
                value={item.quantity}
                readOnly
                className="text-center"
              />
            </div>
            <button
              onClick={() => handleQuantityChange(item, 1)}
              className="w-2/10 h-10 px-3 py-1 border border-gray-300 rounded-r"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Add More Item Button */}
      <button
        onClick={addItem}
        className="w-full h-12 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        Add more item
      </button>
    </div>
  );
};

export default ItemDetails;