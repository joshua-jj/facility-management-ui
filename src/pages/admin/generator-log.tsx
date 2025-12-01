import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { generatorActions } from '@/actions';
import { UnknownAction } from 'redux';
import { GeneratorLog } from '@/types';
import PrivateRoute from '@/components/PrivateRoute';
import ActionDropDown from '@/components/ActionDropDown';
import AddGeneratorLog from '@/components/Modals/AddGeneratorLog';
import { format, parseISO } from 'date-fns';
import { Pagination } from '@/components/Pagination';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const GeneratorLogs = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editLogData, setEditLogData] = useState<GeneratorLog | null>(null);
  // const [currentPage, setCurrentPage] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const {
    IsRequestingGeneratorLogs,
    IsSearchingGeneratorLog,
    allGeneratorLogsList,
    pagination,
  } = useSelector((s: RootState) => s.generator);

  const { meta } = pagination;
  const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

  useEffect(() => {
    dispatch(generatorActions.getGeneratorLogs() as unknown as UnknownAction);
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      dispatch(generatorActions.getGeneratorLogs() as unknown as UnknownAction);
    }
    setSearchQuery(query);
    dispatch(
      generatorActions.searchGeneratorLog({
        text: query,
      }) as unknown as UnknownAction
    );
  };

  const allDepartmentsArray = allGeneratorLogsList?.map((obj) => ({
    ...obj,
    label: obj.nameOfMeeting,
    value: obj.id.toString(),
  }));

  const handleUpdate = (data: GeneratorLog) => {
    setEditLogData(data);
    setShowEditLogModal(true);
    console.log('🚀 ~ handleUpdate ~ data:', data);
  };

  const handleChangePage = (page: number) => {
    dispatch(
      generatorActions.getGeneratorLogs({ page }) as unknown as UnknownAction
    );
  };

  const columns: Column<GeneratorLog>[] = [
    { key: 'nameOfMeeting', header: 'MEETING TITLE' },
    { key: 'generatorType', header: 'GENERATOR USED' },
    { key: 'meetingLocation', header: 'LOCATION' },
    {
      key: 'onTime',
      header: 'DATE',
      render: (value: string | number) => {
        return (
          <span>
            {value ? format(parseISO(String(value)), 'yyyy-MM-dd') : '--'}
          </span>
        );
      },
    },
    {
      key: 'onTime',
      header: 'ON TIME',
      render: (value: string | number) => {
        return (
          <span>{value ? format(parseISO(String(value)), 'HH:mm') : '--'}</span>
        );
      },
    },
    {
      key: 'offTime',
      header: 'OFF TIME',
      render: (value: string | number) => {
        return (
          <span>{value ? format(parseISO(String(value)), 'HH:mm') : '--'}</span>
        );
      },
    },
    {
      key: 'engineStartHours',
      header: 'ENGINE START HOURS',
      render: (value: string | number) => {
        return <span>{value || '--'}</span>;
      },
    },
    {
      key: 'engineOffHours',
      header: 'ENGINE OFF HOURS',
      render: (value: string | number) => {
        return <span>{value || '--'}</span>;
      },
    },
    {
      key: 'dieselLevelOn',
      header: 'DIESEL LEVEL ON',
      render: (value: string | number) => {
        return <span>{value || '--'}</span>;
      },
    },
    {
      key: 'dieselLevelOff',
      header: 'DIESEL LEVEL OFF',
      render: (value: string | number) => {
        return <span>{value || '--'}</span>;
      },
    },
    {
      key: 'id',
      header: '.',
      render: (value: string | number, row: GeneratorLog) => (
        <ActionDropDown handleUpdate={() => handleUpdate(row)} log={true} />
      ),
    },
  ];

  return (
    <PrivateRoute allowedRoles={[1, 4, 5]}>
      <Layout title="Generator Logs">
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
            <div>
              <button className="csv my-4 md:my-0 text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddGeneratorLog className="text-start w-full cursor-pointer">
                  Create Generator Log
                </AddGeneratorLog>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingGeneratorLogs}
            searching={IsSearchingGeneratorLog}
            columns={columns}
            data={allGeneratorLogsList}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={handleChangePage}
            />
          )}
          {showEditLogModal && (
            <AddGeneratorLog
              className="text-start w-full cursor-pointer"
              generatorLog={editLogData}
              open={showEditLogModal}
              onClose={() => setShowEditLogModal(false)}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default GeneratorLogs;
