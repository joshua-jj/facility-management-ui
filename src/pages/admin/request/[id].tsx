import { GetServerSideProps, NextPage } from 'next';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import Layout from '@/components/Layout';
import { authConstants, requestConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  capitalizeFirstLetter,
  formatReadableDate,
  getDisplayStatus,
  getObjectFromStorage,
} from '@/utilities/helpers';
import { requestActions, userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
// import { User } from '@/types';

const optionsFilter = [
  { value: 'approve', label: 'approve' },
  { value: 'decline', label: 'decline' },
];

// interface User {
//   user: { [key: string]: unknown };
//   refreshToken: string;
//   token: string;
// }

interface RequestDetails {
  requesterName: string;
  ministryName?: string;
  requesterEmail: string;
  requesterPhone: string;
  locationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  items: Array<{
    id: number;
    itemId: number;
    storeId: string;
    itemName: string;
    quantityLeased: string;
    quantityReleased: string;
    quantityReturned: number;
    storeName: string;
    conditionBeforeLease: string;
  }>;
  summary: {
    audit: {
      assigneeName: string;
    };
    requestStatus: string;
  };
}

interface RequestDetailsProps {
  requestDetail: RequestDetails;
}

export const getServerSideProps: GetServerSideProps<
  RequestDetailsProps
> = async (ctx) => {
  const { id } = ctx.params || {};
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return {
      notFound: true,
    };
  }

  const cookies = parseCookies(ctx);
  const authToken = cookies?.authToken;

  if (!authToken) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const resp = await axios.get(
      `${requestConstants.REQUEST_URI}/detail/${id}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    console.log('response data:', resp);
    if (resp?.status !== 200) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        requestDetail: resp.data?.data ?? null,
      },
    };
  } catch (err: unknown) {
    console.log('error:', err);

    return {
      props: {
        requestDetail: null,
      },
    };
  }
};

const RequestViewPage: NextPage<RequestDetailsProps> = ({ requestDetail }) => {
  const router = useRouter();
  const { id } = router.query;

  const dispatch = useDispatch();
  const {
    IsUpdatingRequestStatus,
    IsAssigningRequest,
    IsReleasingRequestItems,
    IsReturningRequestItems,
  } = useSelector((s: RootState) => s.request);
  const { userDetails, roleUsersList } = useSelector((s: RootState) => s.user);

  const [requestStatus, setRequestStatus] = useState('');
  const [requestDetails, setRequestDetails] =
    useState<RequestDetails>(requestDetail);
  const [assignedUserId, setAssignedUserId] = useState('');
  const [status, setStatus] = useState(requestDetails?.summary?.requestStatus);
  // const requestItems = requestDetails?.items || [];
  const [items, setItems] = useState(requestDetails?.items || []);
  // const displayStatus = getDisplayStatus(status); // apiStatus is from backend

  const fetchRequestDetails = useCallback(async () => {
    const user = await getObjectFromStorage(authConstants.USER_KEY);
    const resp = await axios.get(
      `${requestConstants.REQUEST_URI}/detail/${id}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: user?.token ? `Bearer ${user.token}` : '',
        },
      }
    );
    setRequestDetails(resp.data.data);
    setStatus(resp.data.data.summary.requestStatus);
  }, [id]);

  // Call this after your event is successful
  useEffect(() => {
    if (requestDetails?.items) {
      const updatedItems = requestDetails.items.map((item) => ({
        ...item,
        quantityReleased: item.quantityLeased,
      }));
      setItems(updatedItems);
    }
  }, [requestDetails?.items]);

  const handleQuantityChange = (index: number, value: string) => {
    const updatedItems = [...items];
    const maxQuantity = Number(requestDetails?.items[index].quantityLeased);

    if (Number(value) > maxQuantity) {
      alert(`The value cannot exceed the maximum quantity of ${maxQuantity}.`);
      return;
    }

    updatedItems[index].quantityReleased = value;
    setItems(updatedItems);
  };

  const handleReturnQuantityChange = (index: number, value: string) => {
    const updatedItems = [...items];
    const maxQuantity = Number(requestDetails?.items[index].quantityLeased);

    if (Number(value) > maxQuantity) {
      alert(`The value cannot exceed the maximum quantity of ${maxQuantity}.`);
      return;
    }

    updatedItems[index].quantityReturned = Number(value);
    setItems(updatedItems);
  };

  console.log('requestDetail:', requestDetail);
  console.log('requestDetails:', requestDetails);
  console.log('requestStatus:', requestStatus);

  const handleUpdateStatus = () => {
    const payload = {
      status: requestStatus,
      requestId: id as string,
    };
    console.log('payload:', payload);
    dispatch(
      requestActions.updateRequestStatus(payload) as unknown as UnknownAction
    );
  };

  const handleAssignRequest = () => {
    const payload = {
      userId: Number(assignedUserId),
      requestId: Number(id),
    };
    console.log('payload:', payload);
    dispatch(requestActions.assignRequest(payload) as unknown as UnknownAction);
  };
  const handleReleaseRequestItems = () => {
    const updatedItems = items.map((item) => ({
      storeId: item.storeId,
      itemId: item.itemId,
      quantityLeased: Number(item.quantityLeased),
      quantityReleased: Number(item.quantityReleased),
      conditionBeforeLease: item.conditionBeforeLease,
      leasedDate: new Date().toISOString(),
    }));
    const payload = {
      items: updatedItems,
      userId: Number(userDetails?.id),
      requestId: Number(id),
    };
    console.log('payload:', payload);
    dispatch(
      requestActions.releaseRequestItems(payload) as unknown as UnknownAction
    );
  };

  const handleReturnRequestItems = () => {
    const updatedItems = items.map((item) => ({
      storeId: item.storeId,
      itemId: item.itemId,
      quantityReturned: Number(item.quantityReturned),
      quantityReleased: Number(item.quantityReleased),
      conditionBeforeLease: item.conditionBeforeLease,
      returnedDate: new Date().toISOString(),
    }));
    const payload = {
      items: updatedItems,
      userId: Number(userDetails?.id),
      requestId: Number(id),
    };
    console.log('payload:', payload);
    dispatch(
      requestActions.returnRequestItems(payload) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    if (userDetails?.roleId === 5) {
      dispatch(
        userActions.getUsersByRole({ roleId: 4 }) as unknown as UnknownAction
      );
    }
  }, [userDetails, dispatch]);

  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.UPDATE_REQUEST_STATUS_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          const displayStatus = getDisplayStatus(requestStatus);

          setStatus(displayStatus);
        }
      }
    );

    return () => listener.remove();
  }, [requestStatus]);
  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.ASSIGN_REQUEST_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          const displayStatus = getDisplayStatus('assign');

          setStatus(displayStatus);
          fetchRequestDetails();
          setAssignedUserId('');
        }
      }
    );

    return () => listener.remove();
  }, [fetchRequestDetails]);

  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.RELEASE_REQUEST_ITEMS_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          const displayStatus = getDisplayStatus('release');

          setStatus(displayStatus);
          fetchRequestDetails();
        }
      }
    );

    return () => listener.remove();
  }, [fetchRequestDetails]);

  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.RETURN_REQUEST_ITEMS_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          const displayStatus = getDisplayStatus('return');

          setStatus(displayStatus);
          fetchRequestDetails();
        }
      }
    );

    return () => listener.remove();
  }, [fetchRequestDetails]);

  const roleUsersArray = roleUsersList?.map((obj) => ({
    ...obj,
    label: obj.firstName + ' ' + obj.lastName,
    value: obj.id.toString(),
  }));

  return (
    <Layout className="grid grid-cols-12 mb-12">
      <div className="col-span-10 col-start-2 p-4 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
        <h2 className="text-xl font-semibold text-textColor mb-4">
          Request Details
        </h2>
        <div className="grid grid-cols-2 gap-2 text-[#0F2552]">
          {/* <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">
              church/ministry/name
            </h3>
            <p className="">
              {capitalizeFirstLetter(requestDetails?.ministryName as string)}
            </p>
          </div> */}
          {/* <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">
              requester&apos;s name
            </h3>
            <p className="">{requestDetails?.assigneeName}</p>
          </div> */}
          <div className="grid grid-cols-subgrid col-span-2 gap-2">
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">
                church/ministry/name
              </h3>
              <p className="">
                {capitalizeFirstLetter(requestDetails?.ministryName as string)}
              </p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">status</h3>
              <p className="">{status}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">
                requester&apos;s name
              </h3>
              <p className="">
                {capitalizeFirstLetter(requestDetails?.requesterName)}
              </p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">email address</h3>
              <p className="">{requestDetails?.requesterEmail}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">phone number</h3>
              <p className="">{requestDetails?.requesterPhone}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">location</h3>
              <p className="">
                {capitalizeFirstLetter(requestDetails?.locationOfUse)}
              </p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">return date</h3>
              <p className="">
                {formatReadableDate(requestDetails?.dateOfReturn)}
              </p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">
                assigned member
              </h3>
              <p className="">{requestDetails?.summary?.audit.assigneeName}</p>
            </div>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">description</h3>
            <p className="">
              {capitalizeFirstLetter(requestDetails?.descriptionOfRequest)}
            </p>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <div className="flex items-center justify-between">
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  ITEM(s)
                </h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { itemName: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.itemName}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">STORE</h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { storeName: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.storeName}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  CONDITION
                </h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { conditionBeforeLease: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.conditionBeforeLease}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  QTY REQUESTED
                </h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { quantityLeased: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.quantityLeased}
                      </p>
                    )
                  )}
              </div>
              {requestDetails?.summary?.requestStatus === 'Collected' && (
                <div className="">
                  <h4 className="text-xs uppercase font-semibold mb-2">
                    QTY RELEASED
                  </h4>
                  {requestDetails?.items &&
                    requestDetails?.items.map(
                      (item: { quantityReleased: string }, index: number) => (
                        <p key={index} className="text-sm leading-7">
                          {item.quantityReleased}
                        </p>
                      )
                    )}
                </div>
              )}
              {requestDetails?.summary?.requestStatus === 'Completed' && (
                <div className="">
                  <h4 className="text-xs uppercase font-semibold mb-2">
                    QTY RETURNED
                  </h4>
                  {requestDetails?.items &&
                    requestDetails?.items.map(
                      (item: { quantityReturned: number }, index: number) => (
                        <p key={index} className="text-sm leading-7">
                          {item.quantityReturned}
                        </p>
                      )
                    )}
                </div>
              )}
              {userDetails?.roleId === 4 &&
                requestDetails?.summary?.requestStatus === 'Assigned' && (
                  <div className="">
                    <h4 className="text-xs uppercase font-semibold mb-2">
                      QTY RELEASED
                    </h4>
                    <div className="flex flex-col gap-2">
                      {items &&
                        items.map(
                          (
                            item: { quantityReleased?: string },
                            index: number
                          ) => (
                            <input
                              key={index}
                              type="number"
                              name="quantityReleased"
                              value={item.quantityReleased}
                              placeholder="0"
                              onChange={(e) =>
                                handleQuantityChange(index, e.target.value)
                              }
                              className="text-sm leading-7 border border-gray-300 rounded px-2 py-1 w-20"
                            />
                          )
                        )}
                    </div>
                  </div>
                )}
              {userDetails?.roleId === 4 &&
                requestDetails?.summary?.requestStatus === 'Collected' && (
                  <div className="">
                    <h4 className="text-xs uppercase font-semibold mb-2">
                      QTY RETURNED
                    </h4>
                    <div className="flex flex-col gap-2">
                      {items &&
                        items.map(
                          (
                            item: { quantityReturned?: number },
                            index: number
                          ) => (
                            <input
                              key={index}
                              type="number"
                              name="quantityReleased"
                              value={item.quantityReturned}
                              placeholder="0"
                              onChange={(e) =>
                                handleReturnQuantityChange(
                                  index,
                                  e.target.value
                                )
                              }
                              className="text-sm leading-7 border border-gray-300 rounded px-2 py-1 w-20"
                            />
                          )
                        )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
        {userDetails?.roleId === 3 &&
          requestDetails?.summary?.requestStatus === 'Pending' && (
            <div className="my-4">
              <CustomDropdownSelect
                options={optionsFilter}
                value={requestStatus}
                onChange={setRequestStatus}
                placeholder="Select status"
                noSearch
                // showSelectedLabel
              />
            </div>
          )}
        {userDetails?.roleId === 5 &&
          requestDetails?.summary?.requestStatus === 'Approved' && (
            <div className="my-4">
              <CustomDropdownSelect
                options={roleUsersArray}
                value={assignedUserId}
                onChange={setAssignedUserId}
                placeholder="Select Member to assign request to"
                noSearch
                // showSelectedLabel
              />
            </div>
          )}

        <div className="flex justify-end mt-8 mb-4">
          {userDetails?.roleId === 4 &&
          requestDetails?.summary?.requestStatus === 'Assigned' ? (
            <button
              onClick={handleReleaseRequestItems}
              className="text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] cursor-pointer transition bg-[#B28309] rounded-[2px]"
            >
              {IsReleasingRequestItems ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Release'
              )}
            </button>
          ) : requestDetails?.summary?.requestStatus === 'Collected' &&
            userDetails?.roleId === 4 ? (
            <button
              onClick={handleReturnRequestItems} // Replace with your actual handler for return
              className="text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] cursor-pointer transition bg-[#0F2552] rounded-[2px] ml-2"
            >
              {IsReturningRequestItems ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Return'
              )}
            </button>
          ) : (
            <button
              onClick={
                requestStatus !== '' ? handleUpdateStatus : handleAssignRequest
              }
              disabled={requestStatus === '' && assignedUserId === ''}
              className="text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] cursor-pointer transition bg-[#B28309] rounded-[2px]"
            >
              {IsUpdatingRequestStatus || IsAssigningRequest ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Submit'
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RequestViewPage;
