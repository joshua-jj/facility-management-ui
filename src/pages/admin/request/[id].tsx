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

const conditionOptions = [
   { value: 'Good', label: 'Good' },
   { value: 'Bad', label: 'Bad' },
   { value: 'Not specified', label: 'Not specified' },
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
         units?: Array<{
            serialNumber: string;
            condition?: string;
            storeId?: number | null;
            storeName?: string | null;
         }>;
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

   const [itemTrackingModes, setItemTrackingModes] = useState<
      Record<number, string>
   >({});

   // Per-item condition for release/return
   const [releaseConditions, setReleaseConditions] = useState<Record<number, string>>({});
   const [returnConditions, setReturnConditions] = useState<Record<number, string>>({});


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

         const itemData = resp.data?.data;
         const trackingMode = itemData?.trackingMode || 'Quantity';
         setItemTrackingModes((prev) => ({ ...prev, [itemId]: trackingMode }));

         const units =
            itemData?.itemUnits?.map(
               (unit: {
                  id: number;
                  serialNumber: string;
                  condition: string;
                  store: { id: number };
               }) => ({
                  value: unit.id,
                  label: unit.condition && unit.condition !== 'Not specified'
                     ? `${unit.serialNumber} - ${unit.condition}`
                     : unit.serialNumber,
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
      // Validate that units are selected for each SERIALIZED item
      const hasEmptyUnits = items.some((item) => {
         const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
         return isSerialized && (!selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0);
      });
      if (hasEmptyUnits) {
         dispatch(appActions.setSnackBar({ type: 'warning', message: 'Please select units for all serialized items before releasing.', variant: 'warning' }) as unknown as UnknownAction);
         return;
      }

      const updatedItems = items.map((item) => {
         const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
         const condition = releaseConditions[item.itemId] || 'Not specified';

         let units: SelectedUnit[] = selectedUnits[item.itemId] || [];
         // For serialized items with a global condition override, apply it to each unit
         if (isSerialized && units.length > 0 && releaseConditions[item.itemId]) {
            units = units.map((u) => ({ ...u, condition }));
         }

         return {
            itemId: item.itemId,
            quantityLeased: Number(item.quantityLeased),
            quantityReleased: isSerialized
               ? (selectedUnits[item.itemId]?.length || 0)
               : Number(item.quantityReleased) || Number(item.quantityLeased),
            leasedDate: new Date().toISOString(),
            units,
         };
      });
      const payload = {
         items: updatedItems,
         requestId: Number(id),
      };
      dispatch(
         requestActions.releaseRequestItems(payload) as unknown as UnknownAction
      );
   };

   const handleReturnRequestItems = () => {
      // Validate that units are selected for each SERIALIZED item
      const hasEmptyUnits = items.some((item) => {
         const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
         return isSerialized && (!selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0);
      });
      if (hasEmptyUnits) {
         dispatch(appActions.setSnackBar({ type: 'warning', message: 'Please select units for all serialized items before returning.', variant: 'warning' }) as unknown as UnknownAction);
         return;
      }

      // Full-return policy: quantityReturned always equals quantityReleased.
      // For serialized items, units are seeded from the release audit, so
      // the assignee can only edit per-unit condition — never the set.
      const updatedItems = items.map((item) => {
         const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
         let units: SelectedUnit[] = selectedUnits[item.itemId] || [];
         if (isSerialized && units.length > 0 && returnConditions[item.itemId]) {
            const condition = returnConditions[item.itemId];
            units = units.map((u) => ({ ...u, condition }));
         }

         return {
            itemId: item.itemId,
            quantityReturned: Number(item.quantityReleased),
            quantityReleased: Number(item.quantityReleased),
            returnedDate: new Date().toISOString(),
            units,
         };
      });
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

   // Return flow forces full returns: seed selectedUnits with exactly the
   // units that were released, using their release-time conditions as defaults.
   // Prev wins so the assignee's condition edits aren't clobbered on re-render.
   useEffect(() => {
      if (!isMemberCollected || !requestDetails?.audit?.items) return;
      const seed: Record<number, SelectedUnit[]> = {};
      requestDetails.audit.items.forEach((item) => {
         if (item.units?.length) {
            seed[item.itemId] = item.units.map((u) => ({
               serialNumber: u.serialNumber,
               condition: u.condition || 'Not specified',
            }));
         }
      });
      setSelectedUnits((prev) => ({ ...seed, ...prev }));
   }, [isMemberCollected, requestDetails?.audit?.items]);

   // Pre-fetch item details (tracking mode + units) for all items when member needs to act
   useEffect(() => {
      if ((isMemberAssigned || isMemberCollected) && requestDetails?.audit?.items) {
         requestDetails.audit.items.forEach((item) => {
            fetchItemUnits(item.itemId);
         });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isMemberAssigned, isMemberCollected, requestDetails?.audit?.items]);

   // Full-return policy: serialized items need units seeded from audit
   // (always true unless the release persisted zero units, which would be a
   // data bug). Quantity items only need quantityReleased > 0.
   const returnButtonDisabled = isMemberCollected && items.some((item) => {
      const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
      if (isSerialized) {
         return !selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0;
      }
      return !item.quantityReleased || Number(item.quantityReleased) <= 0;
   });

   // Check if release button should be disabled
   const releaseButtonDisabled = isMemberAssigned && items.some((item) => {
      const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
      if (isSerialized) {
         return !selectedUnits[item.itemId] || selectedUnits[item.itemId].length === 0;
      }
      return false;
   });

   // ── Shared styled input for qty fields ──────────────────────────────────
   const themedInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input
         {...props}
         className={`w-24 text-sm text-center rounded-lg px-2.5 py-1.5 outline-none transition-all focus:ring-2 focus:ring-[#B28309]/30 tabular-nums ${props.className ?? ''}`}
         style={{
            background: 'var(--surface-low, rgba(15,37,82,0.04))',
            border: '1.5px solid var(--border-strong, rgba(15,37,82,0.25))',
            color: 'var(--text-primary, #0F2552)',
         }}
      />
   );

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

            {/* ── Requested Items ─────────────────────────────────────────────────────── */}
            <DetailSection title="Requested Items">
               {/* Card-based layout for MEMBER action states */}
               {(isMemberAssigned || isMemberCollected) ? (
                  <div className="space-y-3 p-4">
                     {requestDetails?.audit?.items && requestDetails.audit.items.map((item, index) => {
                        const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
                        const selectedCount = selectedUnits[item.itemId]?.length ?? 0;
                        const releaseCondition = releaseConditions[item.itemId] || '';
                        const returnCondition = returnConditions[item.itemId] || '';
                        // Qty is read-only when: serialized (count derived from units),
                        // or in return mode (full-return policy locks qty = quantityReleased).
                        const qtyIsReadOnly = isSerialized || isMemberCollected;
                        const qtyReadOnlyValue = isSerialized
                           ? selectedCount
                           : Number(item.quantityReleased ?? 0);

                        return (
                           <div
                              key={index}
                              className="rounded-xl p-4 border transition-all"
                              style={{
                                 background: 'var(--surface-paper, #fff)',
                                 borderColor: 'var(--border-default, rgba(15,37,82,0.12))',
                              }}
                           >
                              {/* Item header */}
                              <div className="flex items-start justify-between mb-3">
                                 <div>
                                    <p className="text-sm font-semibold text-[#0F2552] dark:text-white/90 leading-tight">
                                       {item.itemName}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                       Requested:&nbsp;<span className="font-medium">{item.quantityLeased}</span>
                                       {(showReleasedQty || isMemberCollected) && (
                                          <>
                                             &nbsp;&middot;&nbsp;Released:&nbsp;<span className="font-medium">{item.quantityReleased}</span>
                                          </>
                                       )}
                                       {isSerialized && (
                                          <>&nbsp;&middot;&nbsp;<span className="text-[#B28309]">Serialized</span></>
                                       )}
                                    </p>
                                 </div>
                              </div>

                              {/* Controls row */}
                              <div className="flex flex-wrap gap-3 mb-3">
                                 {/* QTY field */}
                                 <div className="flex flex-col gap-1">
                                    <label className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                       {isMemberAssigned ? 'Qty Releasing' : 'Qty Returning'}
                                    </label>
                                    {qtyIsReadOnly ? (
                                       <div
                                          className="w-24 text-sm text-center rounded-lg px-2.5 py-1.5 tabular-nums font-medium"
                                          style={{
                                             background: 'var(--surface-low, rgba(15,37,82,0.04))',
                                             border: '1.5px solid var(--border-default, rgba(15,37,82,0.12))',
                                             color: 'var(--text-primary, #0F2552)',
                                          }}
                                       >
                                          {qtyReadOnlyValue}
                                       </div>
                                    ) : (
                                       themedInput({
                                          type: 'text',
                                          inputMode: 'numeric',
                                          value: items[index]?.quantityReleased ?? '',
                                          placeholder: '0',
                                          onChange: (e) => {
                                             const raw = e.target.value.replace(/[^0-9]/g, '');
                                             const max = Number(requestDetails?.audit?.items[index]?.quantityLeased ?? 0);
                                             const val = raw === '' ? '' : String(Math.min(Number(raw), max));
                                             handleQuantityChange(index, val);
                                          },
                                       })
                                    )}
                                 </div>

                                 {/* Condition dropdown — only for QUANTITY items; serialized items get per-unit condition below */}
                                 {!isSerialized && (
                                    <div className="flex flex-col gap-1 min-w-[160px]">
                                       <label className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                          Condition
                                       </label>
                                       <SmallSelect
                                          options={conditionOptions}
                                          value={isMemberAssigned ? releaseCondition : returnCondition}
                                          placeholder="Select condition"
                                          onChange={(val) => {
                                             if (isMemberAssigned) {
                                                setReleaseConditions((prev) => ({ ...prev, [item.itemId]: val as string }));
                                             } else {
                                                setReturnConditions((prev) => ({ ...prev, [item.itemId]: val as string }));
                                             }
                                          }}
                                       />
                                    </div>
                                 )}
                              </div>

                              {/* Unit selector — serialized items only.
                                  Release: multi-select picker + per-unit conditions.
                                  Return: picker hidden, unit list pre-seeded from the release audit,
                                          assignee only edits per-unit condition. */}
                              {isSerialized && (
                                 <div className="flex flex-col gap-2">
                                    {isMemberAssigned && (
                                       <>
                                          <label className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                             Select Units
                                          </label>
                                          <SmallSelect
                                             multiple
                                             quantity={Number(item.quantityLeased) || 1}
                                             value={(selectedUnits[item.itemId] || []).map((u) => u.serialNumber)}
                                             options={(itemUnitsOptions[item.itemId] || []).map((opt) => ({
                                                value: opt.data.serialNumber,
                                                label: `${opt.data.serialNumber}${opt.data.condition && opt.data.condition !== 'Not specified' ? ` — ${opt.data.condition}` : ''}`,
                                                data: opt.data,
                                             }))}
                                             placeholder="Select units to release"
                                             onOpen={() => fetchItemUnits(item.itemId)}
                                             onChange={(selectedIds) => {
                                                const fullUnits = (itemUnitsOptions[item.itemId] || [])
                                                   .filter((opt) => (selectedIds as string[]).includes(opt.data.serialNumber))
                                                   .map((opt) => ({
                                                      serialNumber: opt.data.serialNumber,
                                                      condition: opt.data.condition || 'Not specified',
                                                   }));
                                                setSelectedUnits((prev) => ({
                                                   ...prev,
                                                   [item.itemId]: fullUnits,
                                                }));
                                             }}
                                          />
                                       </>
                                    )}

                                    {/* Per-unit condition selector */}
                                    {(selectedUnits[item.itemId]?.length ?? 0) > 0 && (
                                       <div className="mt-2 space-y-1.5">
                                          <p className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                             {isMemberCollected ? 'Returning Units' : 'Unit Conditions'}
                                          </p>
                                          {selectedUnits[item.itemId].map((unit, uIdx) => (
                                             <div
                                                key={unit.serialNumber}
                                                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                                                style={{
                                                   background: 'var(--surface-low, rgba(15,37,82,0.04))',
                                                   border: '1px solid var(--border-default, rgba(15,37,82,0.08))',
                                                }}
                                             >
                                                <span className="text-xs font-mono flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                                                   {unit.serialNumber}
                                                </span>
                                                <div className="w-[120px] shrink-0">
                                                   <SmallSelect
                                                      options={conditionOptions}
                                                      value={unit.condition || ''}
                                                      placeholder="Condition"
                                                      onChange={(val) => {
                                                         setSelectedUnits((prev) => {
                                                            const updated = [...(prev[item.itemId] || [])];
                                                            updated[uIdx] = { ...updated[uIdx], condition: val as string };
                                                            return { ...prev, [item.itemId]: updated };
                                                         });
                                                      }}
                                                   />
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  /* Read-only table for other roles / statuses */
                  <div className="overflow-x-auto rounded-b-xl">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                              <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">
                                 Item Name
                              </th>
                              <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">
                                 Qty Requested
                              </th>
                              {showReleasedQty && (
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">
                                    Qty Released
                                 </th>
                              )}
                              {showReturnedQty && (
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">
                                    Qty Returned
                                 </th>
                              )}
                           </tr>
                        </thead>
                        <tbody>
                           {requestDetails?.audit?.items &&
                              requestDetails.audit.items.map((item, index) => (
                                 <tr
                                    key={index}
                                    className={`border-b border-gray-50 dark:border-white/[0.03] last:border-b-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.025] transition-colors ${
                                       index % 2 !== 0 ? 'bg-gray-50/40 dark:bg-white/[0.01]' : ''
                                    }`}
                                 >
                                    <td className="px-4 py-3.5 text-sm font-medium text-[#0F2552] dark:text-white/85">
                                       {item.itemName}
                                    </td>
                                    <td className="px-4 py-3.5 text-sm tabular-nums text-[#0F2552] dark:text-white/75">
                                       {item.quantityLeased}
                                    </td>
                                    {showReleasedQty && (
                                       <td className="px-4 py-3.5 text-sm tabular-nums text-[#0F2552] dark:text-white/75">
                                          {item.quantityReleased}
                                       </td>
                                    )}
                                    {showReturnedQty && (
                                       <td className="px-4 py-3.5 text-sm tabular-nums text-[#0F2552] dark:text-white/75">
                                          {item.quantityReturned}
                                       </td>
                                    )}
                                 </tr>
                              ))}
                        </tbody>
                     </table>
                  </div>
               )}
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
                           disabled={releaseButtonDisabled}
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
                           disabled={returnButtonDisabled}
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
