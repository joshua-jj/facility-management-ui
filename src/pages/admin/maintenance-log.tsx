import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { maintenanceActions } from '@/actions';
import { UnknownAction } from 'redux';
import { MaintenanceLog } from '@/types';
import { format, parseISO } from 'date-fns';
import AddMaintenanceLog from '@/components/Modals/AddMaintenanceLog';
import PrivateRoute from '@/components/PrivateRoute';
import ActionDropDown from '@/components/ActionDropDown';
import { numberWithCommas } from '@/utilities/helpers';
import { Pagination } from '@/components/Pagination';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const MaintenanceLogs = () => {
  const dispatch = useDispatch();
  const {
    IsRequestingMaintenanceLogs,
    IsSearchingMaintenanceLog,
    allMaintenanceLogsList,
    pagination,
  } = useSelector((s: RootState) => s.maintenance);

  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showEditMaintenanceModal, setShowEditMaintenanceModal] =
    useState(false);
  const [editMaintenanceData, setEditMaintenanceData] =
    useState<MaintenanceLog | null>(null);

  const { meta } = pagination;
  const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

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

  const handleUpdate = (data: MaintenanceLog) => {
    console.log('🚀 ~ handleUpdate ~ data:', data);
    setEditMaintenanceData(data);
    setShowEditMaintenanceModal(true);
  };

  const handleChangePage = (page: number) => {
    dispatch(
      maintenanceActions.getMaintenanceLogs({
        page,
      }) as unknown as UnknownAction
    );
  };

  // const handleDelete = (data: object) => {
  //   console.log('🚀 ~ handleDelete ~ data:', data);
  // };

  const columns: Column<MaintenanceLog>[] = [
    { key: 'serviceItemName', header: 'SERVICED ITEM' },
    {
      key: 'costOfMaintenance',
      header: 'COST',
      render: (value: string | number) => {
        return <span>{numberWithCommas(Number(value))}</span>;
      },
    },
    { key: 'artisanName', header: 'ARTISAN NAME' },
    { key: 'artisanPhone', header: 'ARTISAN NUMBER' },
    { key: 'signature', header: 'SIGNATURE' },
    {
      key: 'maintenanceDate',
      header: 'DATE',
      render: (value: string | number) => {
        return <span>{format(parseISO(String(value)), 'yyyy-MM-dd')}</span>;
      },
    },
    {
      key: 'id',
      header: '.',
      render: (value: string | number, row: object) => (
        <ActionDropDown
          handleUpdate={() => handleUpdate(row as MaintenanceLog)}
          log={true}
        />
      ),
    },
  ];

  return (
    <PrivateRoute allowedRoles={[1, 4, 5]}>
      <Layout title="Maintenance Logs">
        <div className="p-0 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
          <Formsy className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-[17rem]">
                <input
                  type="text"
                  name="searchQuery"
                  value={searchQuery}
                  placeholder="Search"
                  onChange={handleSearch}
                  className="px-3 py-2 block w-full rounded border border-[rgba(15,37,82,0.2)] shadow-sm"
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
                  <div className="z-[999] filter-options absolute bg-white rounded mt-[0.2rem] left-0 md:left-auto md:right-0 min-w-full w-[15rem] md:w-[20rem] border-[0.5px] border-[rgba(15,37,82,0.15)] shadow-[16px_0px_32px_0px_rgba(rgba(150,150,150,0.15))]">
                    <h4 className="px-4 py-3 font-semibold">Filter by</h4>
                    <hr className="m-0 p-0 border border-[rgba(228,229,231,1)]" />

                    <div className="p-4">
                      <div className="mb-4">
                        <CustomDropdownSelect
                          options={optionsFilter}
                          value={statusFilter}
                          onChange={setStatusFilter}
                          placeholder="Status"
                          // showSelectedLabel
                        />
                      </div>

                      <div className="mb-4">
                        <CustomDropdownSelect
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
            <div className="">
              <button className="csv my-4 md:my-0 text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddMaintenanceLog className="text-start w-full cursor-pointer">
                  Create Maintenance Log
                </AddMaintenanceLog>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingMaintenanceLogs}
            searching={IsSearchingMaintenanceLog}
            columns={columns}
            data={allMaintenanceLogsList}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={handleChangePage}
            />
          )}
          {showEditMaintenanceModal && (
            <AddMaintenanceLog
              className="text-start w-full cursor-pointer"
              maintenanceData={editMaintenanceData}
              open={showEditMaintenanceModal}
              onClose={() => setShowEditMaintenanceModal(false)}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default MaintenanceLogs;
