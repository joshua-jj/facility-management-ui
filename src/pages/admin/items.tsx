/* eslint-disable @typescript-eslint/no-unused-vars */
import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { itemActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Item } from '@/types';
import { isWithinInterval, parseISO } from 'date-fns';
import classNames from 'classnames';
import { Pagination } from '@/components/Pagination';
import AddItem from '@/components/Modals/AddItem';
import PrivateRoute from '@/components/PrivateRoute';
import { FilterIcon } from '@/components/Icons';
import ActionDropDown from '@/components/ActionDropDown';
import { useRouter } from 'next/router';
import DeleteModal from '@/components/Modals/Delete';

const optionsFilter = [
  { value: '1', label: 'approved' },
  { value: '2', label: 'assigned' },
  { value: '3', label: 'collected' },
  { value: '4', label: 'declined' },
  { value: '5', label: 'pending' },
];

const Items = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateTo, setDateTo] = useState('');
  // const [currentPage, setCurrentPage] = useState(1);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [editItemData, setEditItemData] = useState<Item | null>(null);
  const [deleteItemData, setDeleteItemData] = useState<Item | null>(null);

  const { userDetails } = useSelector((s: RootState) => s.user);
  const { IsRequestingAllItems, IsSearchingItem, allItemsList, pagination } =
    useSelector((s: RootState) => s.item);
  const { meta } = pagination;
  const { currentPage, itemCount, itemsPerPage, totalItems, totalPages } = meta;

  // useEffect(() => {
  //   dispatch(itemActions.getAllItems() as unknown as UnknownAction);
  // }, [dispatch]);
  useEffect(() => {
    if (userDetails?.roleId === 3 && userDetails?.departmentId !== undefined) {
      dispatch(
        itemActions.getDepartmentItems({
          departmentId: userDetails.departmentId,
        }) as unknown as UnknownAction
      );
    } else {
      dispatch(itemActions.getAllItems() as unknown as UnknownAction);
    }
  }, [dispatch, userDetails]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      dispatch(itemActions.getAllItems() as unknown as UnknownAction);
    }
    setSearchQuery(query);
    dispatch(
      itemActions.searchItem({ text: query }) as unknown as UnknownAction
    );
  };

  const allDepartmentsArray = allItemsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const filtered = allItemsList?.filter((emp) => {
    const matchStatus = statusFilter ? emp.status === statusFilter : true;
    const matchDept = deptFilter ? emp.name === deptFilter : true;
    const matchDate =
      dateFrom && dateTo
        ? isWithinInterval(parseISO(emp.createdAt!), {
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

  const handleOpen = (data: Item) => {
    console.log('🚀 ~ handleOpen ~ data:', data);
    router.push(
      {
        pathname: '/admin/item/[id]',
        query: { id: data?.id },
      },
      `/admin/item/${data?.id}`
    );
  };

  const handleUpdate = (data: Item) => {
    console.log('🚀 ~ handleUpdate ~ data:', data);
    setEditItemData(data);
    setShowEditItemModal(true);
  };

  const handleDelete = (data: Item) => {
    console.log('🚀 ~ handleDelete ~ data:', data);
    setDeleteItemData(data);
    setShowDeleteItemModal(true);
  };

  const columns: Column<Item>[] = [
    { key: 'name', header: 'ITEM TITLE' },
    ...(userDetails?.roleId !== 3
      ? [
          {
            key: 'department' as keyof Item,
            header: 'DEPARTMENT',
            render: (_: unknown, row: Item) => row.department?.name || 'N/A',
          },
        ]
      : []),
    { key: 'actualQuantity', header: 'TOTAL ITEMS' },
    { key: 'availableQuantity', header: 'AVAILABLE ITEMS' },
    // {
    //   key: 'condition',
    //   header: 'CONDITION',
    //   render: (value: string | number, row: Item) => {
    //     return (
    //       <span
    //         className={classNames(
    //           'border rounded-[2px] uppercase text-[0.6rem] p-1',
    //           {
    //             // 'border-[rgba(0,82,163,0.1)] bg-[rgba(0,82,163,0.15)] text-[rgba(0,82,163,1)]':
    //             //   value === 'collected',
    //             // 'border-[rgba(227,182,35,0.1)] bg-[rgba(227,182,35,0.15)] text-[rgba(227,182,35,1)]':
    //             //   value === 'assigned',
    //             'border-[rgba(0,163,92,0.1)] bg-[rgba(0,163,92,0.15)] text-[rgba(0,163,92,1)]':
    //               value === 'Good',
    //             // 'border-[rgba(255,153,0,0.1))] bg-[rgba(255,153,0,0.15)] text-[rgba(255,153,0,1)]':
    //             //   value === 'pending',
    //             'border-[rgba(195,25,28,0.1)] bg-[rgba(195,25,28,0.15)] text-[rgba(195,25,28,1)]':
    //               value === 'Bad',
    //           }
    //         )}
    //       >
    //         {value}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   key: 'status',
    //   header: 'STATUS',
    //   render: (value: string | number, row: Item) => {
    //     return (
    //       <span
    //         className={classNames(
    //           'border rounded-[2px] uppercase text-[0.6rem] p-1',
    //           {
    //             'border-[rgba(0,82,163,0.1)] bg-[rgba(0,82,163,0.15)] text-[rgba(0,82,163,1)]':
    //               value === 'B',
    //             'border-[rgba(227,182,35,0.1)] bg-[rgba(227,182,35,0.15)] text-[rgba(227,182,35,1)]':
    //               value === 'C',
    //             'border-[rgba(0,163,92,0.1)] bg-[rgba(0,163,92,0.15)] text-[rgba(0,163,92,1)]':
    //               value === 'A',
    //             'border-[rgba(255,153,0,0.1))] bg-[rgba(255,153,0,0.15)] text-[rgba(255,153,0,1)]':
    //               value === 'D',
    //             'border-[rgba(195,25,28,0.1)] bg-[rgba(195,25,28,0.15)] text-[rgba(195,25,28,1)]':
    //               value === 'E',
    //           }
    //         )}
    //       >
    //         {value}
    //       </span>
    //     );
    //   },
    // },
    {
      key: 'id',
      header: '.',
      render: (value: string | number, row: Item) => (
        <ActionDropDown
          items={true}
          handleOpen={() => handleOpen(row)}
          handleUpdate={() => handleUpdate(row)}
          handleDelete={() => handleDelete(row)}
        />
      ),
    },
  ];

  const handleChangePage = (page: number) => {
    if (userDetails?.roleId === 3 && userDetails?.departmentId !== undefined) {
      dispatch(
        itemActions.getDepartmentItems({
          departmentId: userDetails.departmentId,
          page,
        }) as unknown as UnknownAction
      );
    } else {
      dispatch(itemActions.getAllItems({ page }) as unknown as UnknownAction);
    }
  };

  return (
    <PrivateRoute>
      <Layout title="Items">
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
            <div className="mt-4 md:mt-0">
              <button className="csv mr-4 md:mr-0 text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddItem className="text-start w-full cursor-pointer">
                  Create Item
                </AddItem>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingAllItems}
            searching={IsSearchingItem}
            columns={columns}
            data={allItemsList}
            currentPage={currentPage}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={itemsPerPage}
            onPageChange={handleChangePage}
          />
          {showEditItemModal && (
            <AddItem
              className="text-start w-full cursor-pointer"
              item={editItemData} // Pass the Item data as a prop
              open={showEditItemModal}
              onClose={() => setShowEditItemModal(false)}
            />
          )}
          {showDeleteItemModal && (
            <DeleteModal
              className="text-start w-full cursor-pointer"
              itemId={deleteItemData?.id} // Pass the Item data as a prop
              open={showDeleteItemModal}
              onClose={() => setShowDeleteItemModal(false)}
            />
          )}
          {/* {allItemsList.length === 0 && !IsRequestingAllItems && (
            <div className="text-center py-4">No items found</div>
          )} */}
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Items;
