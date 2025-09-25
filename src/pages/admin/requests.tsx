/* eslint-disable @typescript-eslint/no-unused-vars */
import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Column, Table } from '@/components/Table';
import { Pagination } from '@/components/Pagination';
import Formsy from 'formsy-react';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { departmentActions, requestActions } from '@/actions';
import { UnknownAction } from 'redux';
import type { Request } from '@/types';
import PrivateRoute from '@/components/PrivateRoute';
import { DotsIcon } from '@/components/Icons';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useRouter } from 'next/router';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

type Props = {
  row: Request;
};

const Dropdown = (row: Props) => {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const ref = useOnClickOutside<HTMLUListElement>(() => setShowDropdown(false));

  const handleOpen = (data: Props) => {
    console.log('🚀 ~ handleOpen ~ data:', data);
    router.push(
      {
        pathname: '/admin/request/[id]',
        query: { id: data?.row?.id },
      },
      `/admin/request/${data?.row?.id}`
    );
  };

  return (
    <>
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="cursor-pointer"
      >
        <DotsIcon />
      </button>
      {showDropdown && (
        <ul
          ref={ref}
          className="absolute right-[2rem] bg-white z-50 py-1 shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)]"
        >
          <li
            onClick={() => handleOpen(row)}
            className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
          >
            open
          </li>
        </ul>
      )}
    </>
  );
};

const Requests = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // const [currentPage, setCurrentPage] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { userDetails } = useSelector((s: RootState) => s.user);
  const { IsRequestingRequests, allRequestsList, pagination } = useSelector(
    (s: RootState) => s.request
  );
  const { meta } = pagination;
  const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

  useEffect(() => {
    dispatch(departmentActions.getAllDepartments() as unknown as UnknownAction);

    if (userDetails?.roleId === 3) {
      // Role ID 3: Dispatch department-specific requests
      dispatch(
        requestActions.getDepartmentRequests({
          departmentId: userDetails?.departmentId ?? 0,
        }) as unknown as UnknownAction
      );
    } else if (userDetails?.roleId === 4) {
      // Role ID 4: Dispatch user-specific requests
      dispatch(
        requestActions.getAssignedRequests({
          userId: userDetails?.id ?? 0,
        }) as unknown as UnknownAction
      );
    } else {
      dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
    }
  }, [dispatch, userDetails]);

  const handleChangePage = (page: number) => {
    if (userDetails?.roleId === 3) {
      // Role ID 3: Dispatch department-specific requests
      dispatch(
        requestActions.getDepartmentRequests({
          departmentId: userDetails?.departmentId ?? 0,
          page,
        }) as unknown as UnknownAction
      );
    } else if (userDetails?.roleId === 4) {
      // Role ID 4: Dispatch user-specific requests
      dispatch(
        requestActions.getAssignedRequests({
          userId: userDetails?.id ?? 0,
          page,
        }) as unknown as UnknownAction
      );
    } else {
      dispatch(
        requestActions.getAllRequests({ page }) as unknown as UnknownAction
      );
    }
    // if (userDetails?.roleId === 3 && userDetails?.departmentId !== undefined) {
    //   dispatch(
    //     requestActions.getDepartmentItems({
    //       departmentId: userDetails.departmentId,
    //       page,
    //     }) as unknown as UnknownAction
    //   );
    // } else {
    //   dispatch(requestActions.getAllItems({ page }) as unknown as UnknownAction);
    // }
  };

  const pageSize = 10;

  const allDepartmentsArray = allDepartmentsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const columns: Column<Request>[] = [
    ...(userDetails?.roleId !== 3
      ? [
          {
            key: 'requesterDepartment' as keyof Request,
            header: 'DEPARTMENT NAME',
          },
        ]
      : []),
    // { key: 'requesterDepartment', header: 'DEPARTMENT NAME' },
    { key: 'requesterName', header: 'REQUESTER NAME' },
    { key: 'requesterEmail', header: 'REQUESTER EMAIL ADDRESS' },
    { key: 'ministryName', header: 'CHURCH/MINISTRY NAME' },
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
    //   render: (_, row: Request) => row.summary?.requestStatus || 'N/A', // Access department.name
    // },
    { key: 'requestStatus', header: 'REQUEST STATUS' },
    {
      key: 'id',
      header: '.',
      render: (value: string | number, row: Request) => <Dropdown row={row} />,
    },
  ];

  return (
    <PrivateRoute>
      <Layout title="Requests">
        <div className="p-0 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
          {/* =========== Filters ================= */}
          <Formsy className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="w-full md:w-[17rem]">
                <input
                  type="text"
                  name="searchQuery"
                  value={searchQuery}
                  placeholder="Search"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // setCurrentPage(1); // reset on new search
                  }}
                  className="px-3 py-2 block w-full rounded border border-[rgba(15,37,82,0.2)] shadow-sm"
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
                  <div className="z-[999] filter-options absolute bg-white rounded mt-[0.2rem] left-0 md:left-auto md:right-0 min-w-full w-[15rem] md:w-[20rem] border-[0.5px] border-[rgba(15,37,82,0.15)] shadow-[16px_0px_32px_0px_rgba(rgba(150,150,150,0.15))]">
                    <h4 className="px-4 py-3 font-semibold">Filter by</h4>
                    <hr className="m-0 p-0 border border-[rgba(228,229,231,1)]" />

                    <div className="p-4">
                      {/* status filter */}
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
            <button className="mt-4 md:mt-0 csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
              Download CSV
            </button>
          </Formsy>

          <Table
            loading={IsRequestingRequests}
            columns={columns}
            data={allRequestsList}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={handleChangePage}
            />
          )}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Requests;
