/* eslint-disable @typescript-eslint/no-unused-vars */
import AdminLayout from '@/components/Layout/AdminLayout';
import React, { useEffect, useState } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Column, Table } from '@/components/Table';
import { Pagination } from '@/components/Pagination';
import Formsy from 'formsy-react';
import CustomSelect from '@/components/DropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { departmentActions, requestActions } from '@/actions';
import { UnknownAction } from 'redux';
import classNames from 'classnames';
import { Request } from '@/types';

type Users = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'collected' | 'pending' | 'approved' | 'assigned' | 'declined';
  return_date: string;
};

const employees: Users[] = [
  {
    id: 1,
    name: 'Leo King',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'collected',
  },
  {
    id: 2,
    name: 'Sandra Lopez',
    email: 'john@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'pending',
  },
  {
    id: 3,
    name: 'Indiana King',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'approved',
  },
  {
    id: 4,
    name: 'Samson Deen',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'declined',
  },
  {
    id: 5,
    name: 'Sunday Adam',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 6,
    name: 'Emmanuella Olorunsagba',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 7,
    name: 'Chimezule Uchendu',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 8,
    name: 'Stephen Amagba',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 9,
    name: 'Lara Clara',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 10,
    name: 'Clay Kamma',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 11,
    name: 'John El',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
  {
    id: 12,
    name: 'David Akpan',
    email: 'leo@gmail.com',
    phone: '726-555-3962',
    return_date: '2023-01-10',
    status: 'assigned',
  },
];

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const Requests = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { IsRequestingRequests, allRequestsList } = useSelector(
    (s: RootState) => s.request
  );

  useEffect(() => {
    dispatch(departmentActions.getAllDepartments() as unknown as UnknownAction);
    dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
  }, [dispatch]);

  const allDepartmentsArray = allDepartmentsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const filtered = employees.filter((emp) => {
    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    const matchDept = deptFilter ? emp.name === deptFilter : true;
    const matchDate =
      dateFrom && dateTo
        ? isWithinInterval(parseISO(emp.return_date), {
            start: parseISO(dateFrom),
            end: parseISO(dateTo),
          })
        : true;
    const matchSearch = emp.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchStatus && matchDept && matchDate && matchSearch;
  });

  const pageSize = 10;
  // const totalPages = Math.ceil(filtered.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const columns: Column<Request>[] = [
    { key: 'createdBy', header: 'CHURCH/MINISTRY/NAME' },
    { key: 'requesterHodEmail', header: 'EMAIL ADDRESS' },
    { key: 'requesterHodEmail', header: 'PHONE NUMBER' },
    {
      key: 'dateOfReturn',
      header: 'RETURN DATE',
      render: (value: string | number, row: Request) => {
        return <span>{format(parseISO(String(value)), 'yyyy-MM-dd')}</span>;
      },
    },
    // {
    //   key: 'summary',
    //   header: 'STATUS',
    //     render: (value: string | number, row: Request) => {
    //       const status = row.summary?.requestStatus;
    //     return (
    //       <span
    //         className={classNames('border rounded uppercase text-xs p-1', {
    //           'border-[rgba(0,82,163,0.1)] bg-[rgba(0,82,163,0.15)] text-[rgba(0,82,163,1)]':
    //             value === 'collected',
    //           'border-[rgba(227,182,35,0.1)] bg-[rgba(227,182,35,0.15)] text-[rgba(227,182,35,1)]':
    //             value === 'assigned',
    //           'border-[rgba(0,163,92,0.1)] bg-[rgba(0,163,92,0.15)] text-[rgba(0,163,92,1)]':
    //             value === 'approved',
    //           'border-[rgba(255,153,0,0.1))] bg-[rgba(255,153,0,0.15)] text-[rgba(255,153,0,1)]':
    //             value === 'pending',
    //           'border-[rgba(195,25,28,0.1)] bg-[rgba(195,25,28,0.15)] text-[rgba(195,25,28,1)]':
    //             value === 'declined',
    //         })}
    //       >
    //         {value}
    //       </span>
    //     );
    //   },
    // },
  ];

  return (
    <AdminLayout>
      <div className="p-8 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
        {/* Filters */}
        <Formsy className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="w-[17rem]">
              <input
                type="text"
                name="searchQuery"
                value={searchQuery}
                placeholder="Search"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // reset on new search
                }}
                className="mt-1 px-3 py-2 block w-full rounded border border-[rgba(15,37,82,0.2)] shadow-sm"
              />
            </div>

            {/* FILTER */}
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
                    {/* status filter */}
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

                    {/* date filter */}
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
          <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
            Download CSV
          </button>
        </Formsy>

        {/* Table */}
        <Table
          loading={IsRequestingRequests}
          columns={columns}
          data={allRequestsList}
        />
        {/* <Table loading={IsRequestingRequests} columns={columns} data={paginated || filtered} /> */}

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          // onPageSizeChange={(size) => {
          //   setPageSize(size);
          //   setCurrentPage(1); // reset page
          // }}
        />
      </div>
    </AdminLayout>
  );
};

export default Requests;
