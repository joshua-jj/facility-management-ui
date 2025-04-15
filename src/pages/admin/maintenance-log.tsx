import AdminLayout from '@/components/Layout/AdminLayout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import CustomSelect from '@/components/DropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { maintenanceActions } from '@/actions';
import { UnknownAction } from 'redux';
import { MaintenanceLog } from '@/types';
import AddDepartment from '@/components/Modals/AddDepartment';
import PrivateRoute from '@/components/PrivateRoute';
import ActionDropDown from '@/components/ActionDropDown';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const MaintenanceLogs = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // const [currentPage, setCurrentPage] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const {
    IsRequestingMaintenanceLogs,
    IsSearchingMaintenanceLog,
    allMaintenanceLogsList,
  } = useSelector((s: RootState) => s.maintenance);

  useEffect(() => {
    dispatch(
      maintenanceActions.getMaintenanceLogs() as unknown as UnknownAction
    );
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      dispatch(
        maintenanceActions.getMaintenanceLogs() as unknown as UnknownAction
      );
    }
    setSearchQuery(query);
    dispatch(
      maintenanceActions.searchMaintenanceLog({
        text: query,
      }) as unknown as UnknownAction
    );
  };

  const allDepartmentsArray = allMaintenanceLogsList?.map((obj) => ({
    ...obj,
    label: obj.servicedItem,
    value: obj.id.toString(),
  }));

  const handleUpdate = (data: object) => {
    console.log('🚀 ~ handleUpdate ~ data:', data);
  };

  const handleDelete = (data: object) => {
    console.log('🚀 ~ handleDelete ~ data:', data);
  };

  const columns: Column<MaintenanceLog>[] = [
    { key: 'servicedItem', header: 'SERVICED ITEM' },
    { key: 'costOfMaintenance', header: 'COST ' },
    { key: 'artisanName', header: 'ARTISAN NAME' },
    { key: 'artisanPhone', header: 'ARTISAN NUMBER' },
    { key: 'maintenanceDate', header: 'DATE' },
    {
      key: 'id',
      header: '.',
      render: (value: string | number, row: object) => (
        <ActionDropDown
          handleUpdate={() => handleUpdate(row)}
          handleDelete={() => handleDelete(row)}
        />
      ),
    },
  ];

  return (
    <PrivateRoute>
      <AdminLayout>
        <div className="p-8 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
          <Formsy className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
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
                  className="mt-1 px-3 py-2 block w-full rounded border border-[rgba(15,37,82,0.2)] shadow-sm"
                />
              </div>
              <div className="filter relative">
                <button
                  onClick={() => setShowFilterOptions((prev) => !prev)}
                  className="px-3 py-2 rounded border border-[rgba(15,37,82,0.2)]"
                >
                  Filter
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
            <div>
              <button className="csv text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddDepartment className="text-start w-full cursor-pointer">
                  Create Maintenance Log
                </AddDepartment>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingMaintenanceLogs}
            searching={IsSearchingMaintenanceLog}
            columns={columns}
            data={allMaintenanceLogsList}
          />
        </div>
      </AdminLayout>
    </PrivateRoute>
  );
};

export default MaintenanceLogs;
