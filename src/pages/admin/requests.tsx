/* eslint-disable @typescript-eslint/no-unused-vars */
import AdminLayout from '@/components/Layout/AdminLayout';
import React, { useState } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Column, Table } from '@/components/Table';
import { Pagination } from '@/components/Pagination';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';

type Employee = {
  id: number;
  name: string;
  department: string;
  status: 'active' | 'inactive' | 'on leave';
  startDate: string;
};

const employees: Employee[] = [
  {
    id: 1,
    name: 'Alice',
    department: 'HR',
    status: 'active',
    startDate: '2023-01-10',
  },
  {
    id: 2,
    name: 'Bob',
    department: 'IT',
    status: 'on leave',
    startDate: '2022-09-05',
  },
  {
    id: 3,
    name: 'Carol',
    department: 'Finance',
    status: 'inactive',
    startDate: '2021-03-15',
  },
];

const Requests = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filtered = employees.filter((emp) => {
    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    const matchDept = deptFilter ? emp.department === deptFilter : true;
    const matchDate =
      dateFrom && dateTo
        ? isWithinInterval(parseISO(emp.startDate), {
            start: parseISO(dateFrom),
            end: parseISO(dateTo),
          })
        : true;
    const matchSearch = emp.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchStatus && matchDept && matchDate && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const columns: Column<Employee>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'department', header: 'Department' },
    { key: 'status', header: 'Status' },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (value: string | number, row: Employee) => (
        <span>{format(parseISO(String(value)), 'yyyy-MM-dd')}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-8 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
        {/* Filters */}
        <Formsy className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="w-full sm:max-w-xs">
            {/* <TextInput */}
            <input
              type="text"
              name="searchQuery"
              // value={searchQuery}
              placeholder="Search"
              // onValueChange={(e) => {
              //   // setSearchQuery(e.target.value);
              //   setCurrentPage(1); // reset on new search
              // }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All</option>
              <option value="HR">HR</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </Formsy>

        {/* Table */}
        <Table columns={columns} data={filtered} />

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
