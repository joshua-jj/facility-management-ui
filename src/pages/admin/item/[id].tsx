import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { itemConstants, requestConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { capitalizeFirstLetter, formatReadableDate } from '@/utilities/helpers';
import { itemActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import SmallSelect from '@/components/CustomDropdownSelect/SmallSelect';

const conditionOptions = [
  { value: 'Good', label: 'Good' },
  //   { value: 'Fair', label: 'Fair' },
  { value: 'Bad', label: 'Bad' },
  //   { value: 'Damaged', label: 'Damaged' },
  { value: 'Not specified', label: 'Not specified' },
];

interface ItemDetails {
  name: string;
  actualQuantity: number;
  availableQuantity: number;
  fragile: boolean;
  department: {
    name: string;
  };
  itemUnits: Array<{
    id: number;
    condition: string;
    serialNumber: string;
    store: string;
  }>;
  createdBy: string;
  createdAt: string;
}

interface ItemDetailsProps {
  itemDetail: ItemDetails;
}

export const getServerSideProps: GetServerSideProps<ItemDetailsProps> = async (
  ctx
) => {
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
    const resp = await axios.get(`${itemConstants.ITEM_URI}/detail/${id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    // console.log('response data:', resp);
    if (resp?.status !== 200) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        itemDetail: resp.data?.data ?? null,
      },
    };
  } catch (err: unknown) {
    console.log('error:', err);

    return {
      props: {
        itemDetail: null,
      },
    };
  }
};

const ItemViewPage: NextPage<ItemDetailsProps> = ({ itemDetail }) => {
  const router = useRouter();
  const { id } = router.query;

  const dispatch = useDispatch();
  const { IsUpdatingItem } = useSelector((s: RootState) => s.item);
  const { userDetails } = useSelector((s: RootState) => s.user);
  const { allStoresList } = useSelector((s: RootState) => s.store);

  const [requestStatus, setRequestStatus] = useState('');
  const [selectedStores, setSelectedStores] = useState(
    itemDetail?.itemUnits?.map((item) => item.store || '') || []
  );
  const [selectedConditions, setSelectedConditions] = useState(
    itemDetail?.itemUnits?.map((item) => item.condition || '') || []
  );
  const [initialConditions] = useState(
    itemDetail?.itemUnits?.map((item) => item.condition || '') || []
  );
  const [initialStores] = useState(
    itemDetail?.itemUnits?.map((item) => item.store || '') || []
  );
  // const displayStatus = getDisplayStatus(status); // apiStatus is from backend

  //   const fetchRequestDetails = useCallback(async () => {
  //     const user = await getObjectFromStorage(authConstants.USER_KEY);
  //     const resp = await axios.get(
  //       `${itemConstants.ITEM_URI}/detail/${id}`,
  //       {
  //         headers: {
  //           Accept: 'application/json',
  //           Authorization: user?.token ? `Bearer ${user.token}` : '',
  //         },
  //       }
  //     );
  //     setRequestDetails(resp.data.data);
  //     // setStatus(resp.data.data.summary.requestStatus);
  //   }, [id]);
  const arraysEqual = <T,>(a: T[], b: T[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  const isUpdateDisabled =
    arraysEqual(selectedConditions, initialConditions) &&
    arraysEqual(selectedStores, initialStores);
  // Call this after your event is successful
  //   useEffect(() => {
  //     if (requestDetails?.items) {
  //       const updatedItems = requestDetails.items.map((item) => ({
  //         ...item,
  //         quantityReleased: item.quantityLeased,
  //       }));
  //       setItems(updatedItems);
  //     }
  //   }, [requestDetails?.items]);

  const handleStoreChange = (index: number, value: string) => {
    const updated = [...selectedStores];
    updated[index] = value;
    setSelectedStores(updated);
  };

  const handleConditionChange = (index: number, value: string) => {
    const updated = [...selectedConditions];
    updated[index] = value;
    // updated[index] = value === '' ? '' : Number(value);
    setSelectedConditions(updated);
  };
  // const handleConditionChange = useCallback(
  //   (index: number, value: string) => {
  //     setSelectedConditions(prev => {
  //       const updated = [...prev];
  //       updated[index] = value;
  //       return updated;
  //     });
  //   },
  //   []
  // );

  //   const handleQuantityChange = (index: number, value: string) => {
  //     const updatedItems = [...items];
  //     const maxQuantity = Number(requestDetails?.items[index].quantityLeased);

  //     if (Number(value) > maxQuantity) {
  //       alert(`The value cannot exceed the maximum quantity of ${maxQuantity}.`);
  //       return;
  //     }

  //     updatedItems[index].quantityReleased = value;
  //     setItems(updatedItems);
  //   };

  //   const handleReturnQuantityChange = (index: number, value: string) => {
  //     const updatedItems = [...items];
  //     const maxQuantity = Number(requestDetails?.items[index].quantityLeased);

  //     if (Number(value) > maxQuantity) {
  //       alert(`The value cannot exceed the maximum quantity of ${maxQuantity}.`);
  //       return;
  //     }

  //     updatedItems[index].quantityReturned = Number(value);
  //     setItems(updatedItems);
  //   };

  console.log('itemDetail:', itemDetail);
  console.log('selectedConditions:', selectedConditions);
  console.log('selectedStores:', selectedStores);
  console.log('isUpdateDisabled:', isUpdateDisabled);

  const handleUpdateItem = () => {
    const updatedItemUnits = itemDetail.itemUnits.map((unit, index) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { serialNumber, store, ...rest } = unit;
      return {
        ...rest,
        condition: selectedConditions[index],
        storeId: Number(selectedStores[index]),
      };
    });

    const payload = {
      itemId: id as string,
      itemUnits: updatedItemUnits,
    };

    console.log('payload:', payload);
    dispatch(itemActions.updateItem(payload) as unknown as UnknownAction);
  };

  //   const handleAssignRequest = () => {
  //     const payload = {
  //       userId: Number(assignedUserId),
  //       requestId: Number(id),
  //     };
  //     console.log('payload:', payload);
  //     dispatch(requestActions.assignRequest(payload) as unknown as UnknownAction);
  //   };
  //   const handleReleaseRequestItems = () => {
  //     const updatedItems = items.map((item) => ({
  //       storeId: item.storeId,
  //       itemId: item.itemId,
  //       quantityLeased: Number(item.quantityLeased),
  //       quantityReleased: Number(item.quantityReleased),
  //       conditionBeforeLease: item.conditionBeforeLease,
  //       leasedDate: new Date().toISOString(),
  //     }));
  //     const payload = {
  //       items: updatedItems,
  //       userId: Number(userDetails?.id),
  //       requestId: Number(id),
  //     };
  //     console.log('payload:', payload);
  //     dispatch(
  //       requestActions.releaseRequestItems(payload) as unknown as UnknownAction
  //     );
  //   };

  //   const handleReturnRequestItems = () => {
  //     const updatedItems = items.map((item) => ({
  //       storeId: item.storeId,
  //       itemId: item.itemId,
  //       quantityReturned: Number(item.quantityReturned),
  //       quantityReleased: Number(item.quantityReleased),
  //       conditionBeforeLease: item.conditionBeforeLease,
  //       returnedDate: new Date().toISOString(),
  //     }));
  //     const payload = {
  //       items: updatedItems,
  //       userId: Number(userDetails?.id),
  //       requestId: Number(id),
  //     };
  //     console.log('payload:', payload);
  //     dispatch(
  //       requestActions.returnRequestItems(payload) as unknown as UnknownAction
  //     );
  //   };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.UPDATE_REQUEST_STATUS_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          //   setStatus(displayStatus);
        }
      }
    );

    return () => listener.remove();
  }, [requestStatus]);

  return (
    <Layout className="grid grid-cols-12 mb-12">
      <div className="col-span-10 col-start-2 p-4 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
        <h2 className="text-xl font-semibold text-textColor mb-4">
          Item Details
        </h2>
        <div className="grid grid-cols-2 gap-2 text-[#0F2552]">
          <div className="grid grid-cols-subgrid col-span-2 gap-2">
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">name</h3>
              <p className="">
                {capitalizeFirstLetter(itemDetail?.name as string)}
              </p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">
                actual Quantity
              </h3>
              <p className="">{itemDetail?.actualQuantity}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">
                available Quantity
              </h3>
              <p className="">{itemDetail?.availableQuantity}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">department</h3>
              <p className="">{itemDetail?.department?.name}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">created by</h3>
              <p className="">{itemDetail?.createdBy}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">created date</h3>
              <p className="">{formatReadableDate(itemDetail?.createdAt)}</p>
            </div>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">fragile</h3>
            <p className="">
              {itemDetail?.fragile === true ? 'Fragile' : 'Not Fragile'}
            </p>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <div className="flex items-center justify-between">
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  SERIAL NUMBER(s)
                </h4>
                {itemDetail?.itemUnits &&
                  itemDetail?.itemUnits.map(
                    (item: { serialNumber: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.serialNumber}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">ID(s)</h4>
                {itemDetail?.itemUnits &&
                  itemDetail?.itemUnits.map(
                    (item: { id: number }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.id}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  CONDITION
                </h4>
                {itemDetail?.itemUnits &&
                  itemDetail.itemUnits.map((item, index) => (
                    <div key={index} className="mb-2">
                      <SmallSelect
                        value={selectedConditions[index]}
                        options={conditionOptions}
                        placeholder="Select condition"
                        onChange={(value) =>
                          handleConditionChange(index, value as string)
                        }
                      />
                    </div>
                  ))}
              </div>
              {userDetails?.roleId === 5 && (
                <div className="">
                  <h4 className="text-xs uppercase font-semibold mb-2">
                    STORE
                  </h4>
                  {itemDetail?.itemUnits &&
                    itemDetail.itemUnits.map((item, index) => (
                      <div key={index} className="mb-2">
                        <SmallSelect
                          value={selectedStores[index]}
                          options={allStoresList.map((store) => ({
                            value: store.id,
                            label: store.name,
                          }))}
                          placeholder="Select store"
                          onChange={(value) => handleStoreChange(index, value)}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  QTY REQUESTED
                </h4>
                {requestDetails?.itemUnits &&
                  requestDetails?.itemUnits.map(
                    (item: { quantityLeased: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.quantityLeased}
                      </p>
                    )
                  )}
              </div> */}
              {/* {requestDetails?.summary?.requestStatus === 'Collected' && (
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
              )} */}
              {/* {userDetails?.roleId === 4 &&
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
                )} */}
            </div>
          </div>
        </div>
        {/* {userDetails?.roleId === 3 &&
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
          )} */}

        <div className="flex justify-end mt-8 mb-4">
          <button
            onClick={handleUpdateItem}
            disabled={isUpdateDisabled}
            className={`text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] transition bg-[#B28309] rounded-[2px] ${
              isUpdateDisabled
                ? 'opacity-50 cursor-not-allowed'
                : ' cursor-pointer'
            }`}
          >
            {IsUpdatingItem ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ItemViewPage;
