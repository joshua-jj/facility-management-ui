// components/ItemDetails.tsx
'use client';

import React, { useState } from 'react';

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
    { name: 'Generator', available: 3 },
    { name: 'Microphone', available: 0 },
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

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="mb-6">
          {/* Item Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item {item.id} name
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
            >
              {item.name || 'Select item'}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                ▼
              </span>
            </button>

            {isOpen && (
              <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10">
                <div className="p-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      🔍
                    </span>
                  </div>
                </div>
                <ul className="max-h-40 overflow-y-auto">
                  {filteredItems.map((availableItem) => (
                    <li
                      key={availableItem.name}
                      onClick={() => handleSelect(item, availableItem.name)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                    >
                      <span>{availableItem.name}</span>
                      <span
                        className={
                          availableItem.available > 0 ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        {availableItem.available > 0 ? 'Available' : 'Unavailable'}
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
          <div className="flex items-center">
            <button
              onClick={() => handleQuantityChange(item, -1)}
              className="px-3 py-1 border border-gray-300 rounded-l"
            >
              -
            </button>
            <input
              type="text"
              value={item.quantity}
              readOnly
              className="w-16 text-center border-t border-b border-gray-300 py-1"
            />
            <button
              onClick={() => handleQuantityChange(item, 1)}
              className="px-3 py-1 border border-gray-300 rounded-r"
            >
              +
            </button>
          </div>
        </div>
      ))}

      {/* Add More Item Button */}
      <button
        onClick={addItem}
        className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        Add more item
      </button>
    </div>
  );
};

export default ItemDetails;