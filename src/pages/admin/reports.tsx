import CustomSelect from '@/components/DropdownSelect';
import { FilterIcon } from '@/components/Icons';
import AdminLayout from '@/components/Layout/AdminLayout';
import { RootState } from '@/redux/reducers';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const Reports = () => {
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const { allItemsList } = useSelector((s: RootState) => s.item);

  const allDepartmentsArray = allItemsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    // if (!query) {
    //   dispatch(itemActions.getAllItems() as unknown as UnknownAction);
    // }
    setSearchQuery(query);
    // dispatch(
    //   itemActions.searchItem({ text: query }) as unknown as UnknownAction
    // );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div className="w-[17rem]">
          <input
            type="text"
            name="searchQuery"
            value={searchQuery}
            placeholder="Search"
            onChange={handleSearch}
            // onChange={(e) => {
            //   setSearchQuery(e.target.value);
            //   // setCurrentPage(1); // reset on new search
            // }}
            className="px-3 py-[0.65rem] block w-full text-xs rounded border border-[rgba(15,37,82,0.2)]"
          />
        </div>
        <div className="filter relative">
          <button
            onClick={() => setShowFilterOptions((prev) => !prev)}
            className="px-3 py-2 text-xs flex items-center rounded border border-[rgba(15,37,82,0.2)]"
          >
            <FilterIcon className="mr-1" /> Filter
          </button>
          {showFilterOptions && (
            <div className="filter-options absolute bg-white rounded mt-[0.2rem] right-0 min-w-full w-[20rem] border-[0.5px] border-[rgba(15,37,82,0.15)] shadow-[16px_0px_32px_0px_rgba(rgba(150,150,150,0.15))]">
              <h4 className="px-4 py-3 font-semibold">Filter by</h4>
              <hr className="m-0 p-0 border border-[rgba(228,229,231,1)]" />

              <div className="p-4">
                <div className="mb-4">
                  <CustomSelect
                    options={optionsFilter}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Status"
                    // showSelectedLabel
                  />
                </div>

                <div className="mb-4">
                  <CustomSelect
                    options={allDepartmentsArray}
                    value={deptFilter}
                    onChange={setDeptFilter}
                    placeholder="Department"
                    // showSelectedLabel
                  />
                </div>
                <div className="mb-4">
                  {/* <label className="block text-sm font-medium text-gray-700">From</label> */}
                  <input
                    type="date"
                    value={dateFrom}
                    placeholder="date"
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button className="rounded text-[#B28309] border border-[#B28309] text-xs px-3 py-2 mr-3 hover:bg-[#ffffff98] transition cursor-pointer">
                    Reset
                  </button>
                  <button className="rounded bg-[#B28309] border border-[#B28309] text-white text-xs px-3 py-2 hover:bg-[#B2830998] hover:border-[#B2830998] transition cursor-pointer">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </AdminLayout>
  );
};

export default Reports;
