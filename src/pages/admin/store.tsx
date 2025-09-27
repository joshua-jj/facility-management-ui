import Layout from '@/components/Layout';
import React, { useEffect, useState } from 'react';
import { Column, Table } from '@/components/Table';
import Formsy from 'formsy-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { storeActions } from '@/actions';
import { UnknownAction } from 'redux';
import { Store } from '@/types';
import PrivateRoute from '@/components/PrivateRoute';
import AddStore from '@/components/Modals/AddStore';

const Stores = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const { IsRequestingStores, IsSearchingStore, allStoresList } = useSelector(
    (s: RootState) => s.store
  );

  useEffect(() => {
    dispatch(storeActions.getStores() as unknown as UnknownAction);
  }, [dispatch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    if (!query) {
      dispatch(storeActions.getStores() as unknown as UnknownAction);
    }
    setSearchQuery(query);
    dispatch(
      storeActions.searchStore({ text: query }) as unknown as UnknownAction
    );
  };

  // const handleUpdate = (data: object) => {
  //   console.log('🚀 ~ handleUpdate ~ data:', data);
  // };

  // const handleDelete = (data: object) => {
  //   console.log('🚀 ~ handleDelete ~ data:', data);
  // };

  const columns: Column<Store>[] = [
    { key: 'name', header: 'STORE TITLE' },
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
      <Layout title="Stores">
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
            </div>
            <div className="mt-4 md:mt-0">
              <button className="csv mr-4 md:mr-0 text-xs cursor-pointer text-[#B28309] px-3 py-3">
                Download CSV
              </button>
              <button className="csv text-xs cursor-pointer text-[#B28309] border border-[#B28309] rounded px-3 py-3">
                <AddStore className="text-start w-full cursor-pointer">
                  Create Store
                </AddStore>
              </button>
            </div>
          </Formsy>
          <Table
            loading={IsRequestingStores}
            searching={IsSearchingStore}
            columns={columns}
            data={allStoresList}
          />
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Stores;
