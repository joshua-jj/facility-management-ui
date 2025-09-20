import { requestActions } from '@/actions';
import BarChart from '@/components/BarChart';
import {
  DueReturnsIcon,
  TotalItemsIcon,
  TotalReportsIcon,
  TotalRequestsIcon,
} from '@/components/Icons';
import Layout from '@/components/Layout';
import { Column, Table } from '@/components/Table';
import { RootState } from '@/redux/reducers';
import { Request } from '@/types';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import DoughnutChart from '@/components/DoughnutChart';
import Calendar from '@/components/Calendar';
import PrivateRoute from '@/components/PrivateRoute';

const stats = [
  { id: 1, icon: <TotalRequestsIcon />, label: 'total requests', value: 14 },
  { id: 2, icon: <DueReturnsIcon />, label: 'due returns', value: 18 },
  { id: 3, icon: <TotalReportsIcon />, label: 'total reports', value: 6 },
  { id: 4, icon: <TotalItemsIcon />, label: 'total items', value: 100 },
];

const Dashboard = () => {
  const dispatch = useDispatch();
  const { userDetails } = useSelector((s: RootState) => s.user);
  const { IsRequestingRequests, allRequestsList } = useSelector(
    (s: RootState) => s.request
  );
  // console.log('🚀 ~ Dashboard ~ allRequestsList:', allRequestsList);

  useEffect(() => {
    if (userDetails?.roleId === 3) {
      dispatch(
        requestActions.getDepartmentRequests({
          departmentId: userDetails?.departmentId ?? 0,
        }) as unknown as UnknownAction
      );
    } else if (userDetails?.roleId === 4) {
      dispatch(
        requestActions.getAssignedRequests({
          userId: userDetails?.id ?? 0,
        }) as unknown as UnknownAction
      );
    } else {
      dispatch(requestActions.getAllRequests() as unknown as UnknownAction);
    }
  }, [dispatch, userDetails]);

  const columns: Column<Request>[] = [
    { key: 'createdBy', header: 'CHURCH/MINISTRY NAME' },
    { key: 'requesterHodEmail', header: 'EMAIL ADDRESS' },
    { key: 'requesterHodEmail', header: 'PHONE NUMBER' },
    {
      key: 'dateOfReturn',
      header: 'RETURN DATE',
      render: (value: string | number) => {
        return <span>{format(parseISO(String(value)), 'yyyy-MM-dd')}</span>;
      },
    },
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
    <PrivateRoute>
      <Layout title="Dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6">
          {stats?.map((stat, index) => (
            <div
              key={index}
              className="p-3 md:p-5 rounded bg-[#ffffff] border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_0px_rgba(150,150,150,0.11)]"
            >
              <div className="flex items-center mb-2 md:mb-4">
                {stat.icon}
                <span className="uppercase text-[0.56rem] md:text-xs ml-3">
                  {stat.label}
                </span>
              </div>
              <h2 className="text-md md:text-2xl font-semibold">
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-7 p-0">
            <div className="bg-white mb-6 rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="px-4 py-5 flex items-center justify-between">
                <h1 className="text-sm font-semibold">Requests</h1>
                <div className="">
                  <Link
                    href="/admin/requests"
                    className="rounded px-2 py-1 border border-[#E4E5E7] text-[#848A95] text-xs"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <Table
                data={allRequestsList?.slice(0, 5)}
                loading={IsRequestingRequests}
                columns={columns}
              />
            </div>
            <div className="p-6 bg-white mb-6 rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-sm font-semibold">Generator Usage</h1>
                <div className="rounded px-2 py-1 border border-[#E4E5E7] text-[#848A95] text-xs">
                  date
                </div>
              </div>
              <BarChart />
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col md:flex-row lg:flex-col justify-between">
            <div className="p-4 bg-white mb-6 h-[45%] min-h-[22rem] rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Maintenance Schedule</h2>
              </div>
              <Calendar />
            </div>
            <div className="p-6 bg-white mb-6 h-[55%] min-h-[25rem] lg:min-h-[22rem] md:min-w-[22rem] lg:min-w-auto rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-sm font-semibold">Item Condition</h1>
                <hr className="" />
              </div>
              <DoughnutChart />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-5 p-0">
            <div className="bg-white mb-6 rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="px-4 py-5 flex items-center justify-between">
                <h1 className="text-sm font-semibold">Reports</h1>
                <div className="">
                  <Link
                    href="/admin/reports"
                    className="rounded px-2 py-1 border border-[#E4E5E7] text-[#848A95] text-xs"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <Table
                data={allRequestsList?.slice(0, 5)}
                loading={IsRequestingRequests}
                columns={columns}
              />
            </div>
          </div>
          <div className="lg:col-span-5 p-0">
            <div className="bg-white mb-6 rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
              <div className="px-4 py-5 flex items-center justify-between">
                <h1 className="text-sm font-semibold">Due Returns</h1>
                <div className="">
                  <Link
                    href="/admin/dashboard"
                    className="rounded px-2 py-1 border border-[#E4E5E7] text-[#848A95] text-xs"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <Table
                data={allRequestsList?.slice(0, 5)}
                loading={IsRequestingRequests}
                columns={columns}
              />
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default Dashboard;
