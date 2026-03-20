import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { departmentActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Department } from '@/types';
import AddDepartment from '@/components/Modals/AddDepartment';
import PrivateRoute from '@/components/PrivateRoute';
// import ActionDropDown from '@/components/ActionDropDown';

const Departments = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const { IsRequestingDepartments, allDepartmentsList } = useSelector(
    (s: RootState) => s.department
  );

  useEffect(() => {
    dispatch(departmentActions.getAllDepartments() as unknown as UnknownAction);
  }, [dispatch]);

  const filteredDepartments = allDepartmentsList?.filter(
    (department) =>
      department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.hodName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.hodEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.hodPhone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const handleUpdate = (data: object) => {
  //   console.log('🚀 ~ handleUpdate ~ data:', data);
  // };

  // const handleDelete = (data: object) => {
  //   console.log('🚀 ~ handleDelete ~ data:', data);
  // };

  const columns: Column<Department>[] = [
    { key: 'name', header: 'DEPARTMENT TITLE' },
    { key: 'hodName', header: 'HOD NAME' },
    { key: 'hodEmail', header: 'EMAIL ADDRESS' },
    { key: 'hodPhone', header: 'PHONE NUMBER' },
    { key: 'itemCount', header: 'NO. ITEM' },
    // {
    //   key: 'id',
    //   header: '.',
    //   render: (value: string | number, row: object) => (
    //     <ActionDropDown
    //       handleUpdate={() => handleUpdate(row)}
    //       handleDelete={() => handleDelete(row)}
    //     />
    //   ),
    // },
  ];

  return (
    <PrivateRoute allowedRoles={[1, 4, 5]}>
      <Layout title="Departments">
        <div className="p-0 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
          <Formsy className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-[17rem]">
                <input
                  type="text"
                  name="searchQuery"
                  value={searchQuery}
                  placeholder="Search"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="px-3 py-2 block w-full rounded border border-[rgba(15,37,82,0.2)] shadow-sm"
                />
              </div>
            </div>
            <div>
              <button className="csv my-4 md:my-0 text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddDepartment className="text-start w-full cursor-pointer">
                  Create Department
                </AddDepartment>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingDepartments}
            columns={columns}
            data={filteredDepartments}
          />
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Departments;
