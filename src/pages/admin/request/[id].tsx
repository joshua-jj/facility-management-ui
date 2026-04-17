import { GetServerSideProps, NextPage } from 'next';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import Layout from '@/components/Layout';
import { authConstants, itemConstants, requestConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
   capitalizeFirstLetter,
   formatReadableDate,
   getDisplayStatus,
   getObjectFromStorage,
} from '@/utilities/helpers';
import { formatPhoneDisplay } from '@/components/FormatValue';
import { appActions, requestActions, userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import SmallSelect from '@/components/CustomDropdownSelect/small';
import { RoleId } from '@/constants/roles.constant';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader, { ActionButton } from '@/components/PageHeader';

const optionsFilter = [
   { value: 'approve', label: 'approve' },
   { value: 'decline', label: 'decline' },
];

interface RequestDetails {
   requesterName: string;
   ministryName?: string;
   requesterEmail: string;
   requesterPhone: string;
   locationOfUse: string;
   dateOfReturn: string;
   descriptionOfRequest: string;
   audit: {
      items: Array<{
         id: number;
         itemId: number;
         itemName: string;
         quantityLeased: string;
         quantityReleased: string;
         quantityReturned: number;
         storeName: string;
         conditionBeforeLease: string;
         unitIds: (number | string)[];
      }>;
      assigneeName: string;
      collectedDate: string;
      completedDate: string;
   };
   requestStatus: string;
}

interface RequestDetailsProps {
   requestDetail: RequestDetails;
}

type SelectedUnit = {
   storeId: number | string;
   serialNumber: string;
   condition: string;
};

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
   } catch {
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
   const [status, setStatus] = useState(requestDetails?.requestStatus);
   const [items, setItems] = useState(requestDetails?.audit.items || []);

   type UnitOption = {
      value: number | string;
      label: string;
      data: {
         id: number;
         serialNumber: string;
         condition: string;
         store: { id: number };
      };
   };

   const [itemUnitsOptions, setItemUnitsOptions] = useState<
      Record<number, UnitOption[]>
   >({});

   const [selectedUnits, setSelectedUnits] = useState<
      Record<number, SelectedUnit[]>
   >({});

   const fetchItemUnits = async (itemId: number) => {
      if (itemUnitsOptions[itemId]) return;

      try {
         const user = await getObjectFromStorage(authConstants.USER_KEY);
         const resp = await axios.get(
            `${itemConstants.ITEM_URI}/detail/${itemId}`,
            {
               headers: {
                  Accept: 'application/json',
                  Authorization: user?.token ? `Bearer ${user.token}` : '',
               },
            }
         );

         const units =
            resp.data?.data?.itemUnits?.map(
               (unit: {
                  id: number;
                  serialNumber: string;
                  condition: string;
                  store: { id: number };
               }) => ({
                  value: unit.id,
                  label: `${unit.serialNumber} - ${unit.condition}`,
                  data: unit,
               })
            ) || [];

         setItemUnitsOptions((prev) => ({ ...prev, [itemId]: units }));
      } catch {
         dispatch(appActions.setSnackBar({ type: 'error', message: 'Failed to load item units. Please try again.', variant: 'error' }) as unknown as UnknownAction);
      }
   };

   const fetchRequestDetails = useCallback(async () => {
      try {
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
         setStatus(resp.data.data.requestStatus);
      } catch {
         dispatch(appActions.setSnackBar({ type: 'error', message: 'Failed to refresh request details.', variant: 'error' }) as unknown as UnknownAction);
      }
   }, [id, dispatch]);

   useEffect(() => {
      if (requestDetails?.audit?.items) {
         const updatedItems = requestDetails.audit.items.map((item) => ({
            ...item,
         }));
         setItems(updatedItems);
      }
   }, [requestDetails?.audit?.items]);

   const handleQuantityChange = (index: number, value: string) => {
      const updatedItems = [...items];
      const maxQuantity = Number(
         requestDetails?.audit?.items[index].quantityLeased
      );

      if (Number(value) > maxQuantity) {
         dispatch(appActions.setSnackBar({ type: 'warning', message: `The value cannot exceed the maximum quantity of ${maxQuantity}.`, variant: 'warning' }) as unknown as UnknownAction);
         return;
      }

      updatedItems[index].quantityReleased = value;
      setItems(updatedItems);
   };

   const handleUpdateStatus = () => {
      const payload = {
         status: requestStatus,
         requestId: String(id),
      };
      dispatch(
         requestActions.updateRequestStatus(payload) as unknown as UnknownAction
      );
   };

   const handleAssignRequest = () => {
      const payload = {
         userId: Number(assignedUserId),
         requestId: Number(id),
      };
      dispatch(requestActions.assignRequest(payload) as unknown as UnknownAction);
   };

   const handleReleaseRequestItems = () => {
      // Validate that units are selected for each item
      const hasEmptyUnits = items.some((item) => !selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0);
      if (hasEmptyUnits) {
         dispatch(appActions.setSnackBar({ type: 'warning', message: 'Please select units for all items before releasing.', variant: 'warning' }) as unknown as UnknownAction);
         return;
      }

      const updatedItems = items.map((item) => ({
         itemId: item.itemId,
         quantityLeased: Number(item.quantityLeased),
         quantityReleased: selectedUnits[item.itemId]?.length || 0,
         leasedDate: new Date().toISOString(),
         units: selectedUnits[item.itemId] || [],
      }));
      const payload = {
         items: updatedItems,
         requestId: Number(id),
      };
      dispatch(
         requestActions.releaseRequestItems(payload) as unknown as UnknownAction
      );
   };

   const handleReturnRequestItems = () => {
      // Validate that units are selected for each item
      const hasEmptyUnits = items.some((item) => !selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0);
      if (hasEmptyUnits) {
         dispatch(appActions.setSnackBar({ type: 'warning', message: 'Please select units for all items before returning.', variant: 'warning' }) as unknown as UnknownAction);
         return;
      }

      const updatedItems = items.map((item) => ({
         itemId: item.itemId,
         quantityReturned: selectedUnits[item.itemId]?.length || 0,
         quantityReleased: Number(item.quantityReleased),
         returnedDate: new Date().toISOString(),
         units: selectedUnits[item.itemId] || [],
      }));
      const payload = {
         items: updatedItems,
         requestId: Number(id),
      };
      dispatch(
         requestActions.returnRequestItems(payload) as unknown as UnknownAction
      );
   };

   useEffect(() => {
      if (userDetails?.roleId === RoleId.SUPER_ADMIN) {
         dispatch(
            userActions.getUsersByRole({ roleId: RoleId.MEMBER }) as unknown as UnknownAction
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
               fetchRequestDetails();
               setRequestStatus('');
            }
         }
      );

      return () => listener.remove();
   }, [requestStatus, fetchRequestDetails]);

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

   const roleUsersArray = useMemo(
      () =>
         roleUsersList?.map((obj) => ({
            ...obj,
            label: obj.firstName + ' ' + obj.lastName,
            value: obj.id.toString(),
         })),
      [roleUsersList]
   );

   const showReleasedQty = requestDetails?.requestStatus === 'Collected' || requestDetails?.requestStatus === 'Completed';
   const showReturnedQty = requestDetails?.requestStatus === 'Completed';
   const isMemberAssigned = userDetails?.roleId === RoleId.MEMBER && requestDetails?.requestStatus === 'Assigned';
   const isMemberCollected = userDetails?.roleId === RoleId.MEMBER && requestDetails?.requestStatus === 'Collected';

   return (
      <Layout className="grid grid-cols-1 md:grid-cols-12 mb-12">
         <div className="md:col-span-10 md:col-start-2 space-y-6">
            <PageHeader title="Request Details" showBreadcrumbs />
            {/* Back button */}
            <button
               onClick={() => router.back()}
               className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-white/50 hover:text-[#0F2552] dark:hover:text-white/80 transition-colors cursor-pointer"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
               Back
            </button>

            {/* Workflow stepper */}
            {requestDetails?.requestStatus && (() => {
               const STEPS = [
                  { label: 'Pending', key: 'Pending' },
                  { label: 'Approved', key: 'Approved' },
                  { label: 'Assigned', key: 'Assigned' },
                  { label: 'Collected', key: 'Collected' },
                  { label: 'Returned', key: 'Completed' },
               ];
               const currentIdx = STEPS.findIndex((s) => s.key === requestDetails.requestStatus);
               const activeIdx = currentIdx === -1 ? 0 : currentIdx;

               return (
                  <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm px-6 py-4">
                     <div className="flex items-center justify-between">
                        {STEPS.map((step, idx) => {
                           const isCompleted = idx < activeIdx;
                           const isCurrent = idx === activeIdx;
                           const isDeclined = requestDetails.requestStatus === 'Declined';
                           const circleClass = isDeclined && isCurrent
                              ? 'bg-red-500 border-red-500 text-white'
                              : isCompleted || isCurrent
                              ? 'bg-[#B28309] border-[#B28309] text-white'
                              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/15 text-gray-300 dark:text-white/25';
                           const labelClass = isDeclined && isCurrent
                              ? 'text-red-500 font-semibold'
                              : isCurrent
                              ? 'text-[#B28309] font-semibold'
                              : isCompleted
                              ? 'text-gray-500 dark:text-white/50'
                              : 'text-gray-300 dark:text-white/25';

                           return (
                              <React.Fragment key={step.key}>
                                 <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${circleClass}`}>
                                       {isCompleted ? (
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                       ) : (
                                          idx + 1
                                       )}
                                    </div>
                                    <span className={`text-[0.6rem] leading-tight text-center whitespace-nowrap transition-colors ${labelClass}`}>
                                       {isDeclined && isCurrent ? 'Declined' : step.label}
                                    </span>
                                 </div>
                                 {idx < STEPS.length - 1 && (
                                    <div className={`flex-1 h-px mx-2 transition-colors ${idx < activeIdx ? 'bg-[#B28309]' : 'bg-gray-200 dark:bg-white/10'}`} />
                                 )}
                              </React.Fragment>
                           );
                        })}
                     </div>
                  </div>
               );
            })()}

            {/* Header card */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-6">
               <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {capitalizeFirstLetter(requestDetails?.requesterName)}
                        </h1>
                        <StatusChip status={status || ''} size="md" pulse />
                     </div>
                     {requestDetails?.ministryName && (
                        <p className="text-sm text-gray-500 dark:text-white/50">
                           {capitalizeFirstLetter(requestDetails.ministryName)}
                        </p>
                     )}
                     <div className="flex flex-wrap items-center gap-4 pt-1">
                        {requestDetails?.requesterEmail && (
                           <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {requestDetails.requesterEmail}
                           </span>
                        )}
                        {requestDetails?.requesterPhone && (
                           <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {formatPhoneDisplay(requestDetails.requesterPhone)}
                           </span>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Request Information */}
            <DetailSection title="Request Information">
               <DetailRow
                  label="Ministry Name"
                  value={capitalizeFirstLetter(requestDetails?.ministryName as string)}
               />
               <DetailRow
                  label="Requester Name"
                  value={capitalizeFirstLetter(requestDetails?.requesterName)}
               />
               <DetailRow
                  label="Email"
                  value={requestDetails?.requesterEmail}
               />
               <DetailRow
                  label="Phone"
                  value={formatPhoneDisplay(requestDetails?.requesterPhone)}
               />
               <DetailRow
                  label="Location"
                  value={capitalizeFirstLetter(requestDetails?.locationOfUse)}
               />
               <DetailRow
                  label="Return Date"
                  value={
                     status === 'Collected'
                        ? formatReadableDate(requestDetails?.audit.collectedDate)
                        : formatReadableDate(
                             status === 'Completed'
                                ? requestDetails?.audit.completedDate
                                : requestDetails?.dateOfReturn
                          )
                  }
               />
               <DetailRow
                  label="Description"
                  value={capitalizeFirstLetter(requestDetails?.descriptionOfRequest)}
               />
               <DetailRow
                  label="Assigned Member"
                  value={requestDetails?.audit.assigneeName}
               />
            </DetailSection>

            {/* Requested Items */}
            <DetailSection title="Requested Items">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5">
                           <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                              Item Name
                           </th>
                           <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                              Qty Requested
                           </th>
                           {(showReleasedQty || isMemberAssigned) && (
                              <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                                 Qty Released
                              </th>
                           )}
                           {(showReturnedQty || isMemberCollected) && (
                              <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                                 Qty Returned
                              </th>
                           )}
                           {(isMemberAssigned || isMemberCollected) && (
                              <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
                                 Select Units
                              </th>
                           )}
                        </tr>
                     </thead>
                     <tbody>
                        {requestDetails?.audit?.items &&
                           requestDetails.audit.items.map((item, index) => (
                              <tr
                                 key={index}
                                 className="border-b border-gray-50 dark:border-white/[0.03] last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                 <td className="px-5 py-3.5 text-sm text-[#0F2552] dark:text-white/85">
                                    {item.itemName}
                                 </td>
                                 <td className="px-5 py-3.5 text-sm text-[#0F2552] dark:text-white/85">
                                    {item.quantityLeased}
                                 </td>

                                 {/* Released qty - read-only for Collected/Completed status */}
                                 {showReleasedQty && !isMemberAssigned && (
                                    <td className="px-5 py-3.5 text-sm text-[#0F2552] dark:text-white/85">
                                       {item.quantityReleased}
                                    </td>
                                 )}

                                 {/* Released qty - editable input for MEMBER + Assigned */}
                                 {isMemberAssigned && (
                                    <td className="px-5 py-3.5">
                                       <input
                                          type="number"
                                          name="quantityReleased"
                                          value={items[index]?.quantityReleased ?? ''}
                                          placeholder="0"
                                          onChange={(e) =>
                                             handleQuantityChange(index, e.target.value)
                                          }
                                          className="w-20 text-sm border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 bg-white dark:bg-white/5 text-[#0F2552] dark:text-white/85 focus:outline-none focus:ring-2 focus:ring-[#B28309]/30 focus:border-[#B28309] transition-all"
                                       />
                                    </td>
                                 )}

                                 {/* Returned qty - read-only for Completed status */}
                                 {showReturnedQty && !isMemberCollected && (
                                    <td className="px-5 py-3.5 text-sm text-[#0F2552] dark:text-white/85">
                                       {item.quantityReturned}
                                    </td>
                                 )}

                                 {/* Unit selection for MEMBER + Assigned (release) */}
                                 {isMemberAssigned && (
                                    <td className="px-5 py-3.5">
                                       <SmallSelect
                                          multiple
                                          quantity={Number(item.quantityLeased) || 1}
                                          value={(selectedUnits[item.itemId] || []).map(
                                             (u) => u.serialNumber
                                          )}
                                          options={(
                                             itemUnitsOptions[item.itemId] || []
                                          ).map((opt) => ({
                                             value: opt.data.serialNumber,
                                             label: `${opt.data.serialNumber} - ${opt.data.condition}`,
                                             data: opt.data,
                                          }))}
                                          placeholder="Select item units"
                                          onOpen={() => fetchItemUnits(item.itemId)}
                                          onChange={(selectedIds) => {
                                             const fullUnits = (
                                                itemUnitsOptions[item.itemId] || []
                                             )
                                                .filter((opt) =>
                                                   selectedIds.includes(
                                                      opt.data.serialNumber
                                                   )
                                                )
                                                .map((opt) => ({
                                                   storeId: opt.data.store.id,
                                                   serialNumber: opt.data.serialNumber,
                                                   condition: opt.data.condition,
                                                }));

                                             setSelectedUnits((prev) => ({
                                                ...prev,
                                                [item.itemId]: fullUnits,
                                             }));
                                          }}
                                       />
                                    </td>
                                 )}

                                 {/* Unit selection for MEMBER + Collected (return) */}
                                 {isMemberCollected && (
                                    <>
                                       <td className="px-5 py-3.5">
                                          <SmallSelect
                                             multiple
                                             quantity={Number(item.quantityReleased) || 1}
                                             value={(selectedUnits[item.itemId] || []).map(
                                                (u) => u.serialNumber
                                             )}
                                             options={(
                                                itemUnitsOptions[item.itemId] || []
                                             ).map((opt) => ({
                                                value: opt.data.serialNumber,
                                                label: `${opt.data.serialNumber} - ${opt.data.condition}`,
                                                data: opt.data,
                                             }))}
                                             placeholder="Select item units to return"
                                             onOpen={() => fetchItemUnits(item.itemId)}
                                             onChange={(selectedIds) => {
                                                const fullUnits = (
                                                   itemUnitsOptions[item.itemId] || []
                                                )
                                                   .filter((opt) =>
                                                      selectedIds.includes(opt.data.serialNumber)
                                                   )
                                                   .map((opt) => ({
                                                      storeId: opt.data.store.id,
                                                      serialNumber: opt.data.serialNumber,
                                                      condition: opt.data.condition,
                                                   }));

                                                setSelectedUnits((prev) => ({
                                                   ...prev,
                                                   [item.itemId]: fullUnits,
                                                }));
                                             }}
                                          />
                                       </td>
                                    </>
                                 )}
                              </tr>
                           ))}
                     </tbody>
                  </table>
               </div>
            </DetailSection>

            {/* Action area */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-5">
               <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  {/* Role-conditional dropdowns */}
                  <div className="w-full sm:max-w-xs">
                     {(userDetails?.roleId === RoleId.HOD) &&
                        requestDetails?.requestStatus === 'Pending' && (
                           <div>
                              <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
                                 Update Status
                              </label>
                              <CustomDropdownSelect
                                 options={optionsFilter}
                                 value={requestStatus}
                                 onChange={setRequestStatus}
                                 placeholder="Select status"
                                 noSearch
                              />
                           </div>
                        )}
                     {userDetails?.roleId === RoleId.SUPER_ADMIN &&
                        requestDetails?.requestStatus === 'Approved' && (
                           <div>
                              <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
                                 Assign Member
                              </label>
                              <CustomDropdownSelect
                                 options={roleUsersArray}
                                 value={assignedUserId}
                                 onChange={setAssignedUserId}
                                 placeholder="Select Member to assign request to"
                                 noSearch
                              />
                           </div>
                        )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                     {isMemberAssigned ? (
                        <ActionButton
                           onClick={handleReleaseRequestItems}
                           variant="primary"
                           size="md"
                        >
                           {IsReleasingRequestItems ? (
                              <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                 Releasing...
                              </div>
                           ) : (
                              'Release Items'
                           )}
                        </ActionButton>
                     ) : isMemberCollected ? (
                        <ActionButton
                           onClick={handleReturnRequestItems}
                           variant="secondary"
                           size="md"
                        >
                           {IsReturningRequestItems ? (
                              <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                 Returning...
                              </div>
                           ) : (
                              'Return Items'
                           )}
                        </ActionButton>
                     ) : (
                        <ActionButton
                           onClick={
                              requestStatus !== '' ? handleUpdateStatus : handleAssignRequest
                           }
                           disabled={requestStatus === '' && assignedUserId === ''}
                           variant="primary"
                           size="md"
                        >
                           {IsUpdatingRequestStatus || IsAssigningRequest ? (
                              <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                 Processing...
                              </div>
                           ) : (
                              'Submit'
                           )}
                        </ActionButton>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </Layout>
   );
};

export default RequestViewPage;
