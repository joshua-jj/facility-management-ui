import { GetServerSideProps, NextPage } from 'next';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import Layout from '@/components/Layout';
import { authConstants, requestConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { usePermission } from '@/hooks/usePermission';
import { useRequestActions } from '@/hooks/useRequestActions';
// RoleId still imported because the API exposes a `getUsersByRole(roleId)`
// endpoint for identity lookups — that's not a capability check, it's
// a "give me the candidate assignees" query and the API speaks role-ids.
import { RoleId } from '@/constants/roles.constant';
import StatusChip from '@/components/StatusChip';
import { DetailField, DetailSection } from '@/components/DetailField';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import ModalWrapper from '@/components/Modals/ModalWrapper';
import { departmentActions } from '@/actions';

const conditionOptions = [
   { value: 'Good', label: 'Good' },
   { value: 'Bad', label: 'Bad' },
];

/**
 * Audit-trail snapshot returned per row (parent / child / flat). The
 * approve / decline fields are written when an HOD acts on the row;
 * release / return fields are written by the assignee on a parent or
 * flat row. See `Request` in `@/types`.
 */
interface RequestDetailsAudit {
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
   // The assignee's user id. Lets the UI gate Release / Return on the
   // viewer actually being the assignee — capability alone (SAs hold
   // `requests:release` via manage) was painting the form on every
   // assigned request, not just the assignee's own.
   assignee?: number | string | null;
   assigner?: string | null;
   dateAssigned?: string | null;
   collectedDate: string;
   collectedBy?: string | null;
   completedDate: string;
   completedBy?: string | null;
   approvedByUserId?: number | null;
   approvedByName?: string | null;
   approvedAt?: string | null;
   declinedByUserId?: number | null;
   declinedByName?: string | null;
   declinedAt?: string | null;
   declineReason?: string | null;
}

/**
 * Detail-page row payload. Mirrors the multi-dept tree-aware shape from
 * the Phase 3 API: a parent carries `children[]`, a child carries a
 * read-only `parent` summary, and a flat row carries neither.
 */
interface RequestDetails {
   id?: number;
   requesterName: string;
   ministryName?: string;
   requesterEmail: string;
   requesterPhone: string;
   locationOfUse: string;
   dateOfReturn: string;
   descriptionOfRequest: string;
   audit: RequestDetailsAudit;
   requestStatus: string;
   parentId?: number | null;
   fulfillingDepartmentId?: number | null;
   fulfillingDepartmentName?: string | null;
   createdAt?: string | null;
   createdBy?: string | null;
   children?: RequestDetails[];
   parent?: RequestDetails;
}

interface RequestDetailsProps {
   requestDetail: RequestDetails;
}

type SelectedUnit = {
   serialNumber: string;
   condition: string;
};

/**
 * Resolve a department id to a name using the loaded department list.
 * Falls back to the `fulfillingDepartmentName` server hint, then to a
 * placeholder. Server-side hint wins when both exist — it represents
 * the snapshot at HOD-action time, not the current state of the dept.
 */
const resolveDepartmentName = (
   row: Pick<RequestDetails, 'fulfillingDepartmentId' | 'fulfillingDepartmentName'> | null | undefined,
   departments: Array<{ id: number; name?: string }>,
): string => {
   if (!row) return '—';
   if (row.fulfillingDepartmentName) return row.fulfillingDepartmentName;
   if (row.fulfillingDepartmentId == null) return '—';
   // Coerce to Number on both sides — bigint columns ride the wire as
   // strings while @PrimaryGeneratedColumn ids come through as numbers,
   // so a strict `===` would silently miss every match.
   const target = Number(row.fulfillingDepartmentId);
   const match = departments.find((d) => Number(d.id) === target);
   return match?.name ?? `Dept #${row.fulfillingDepartmentId}`;
};

/**
 * Resolve approve / decline actor's display name. Prefers the API-
 * provided name field; if not present, surfaces a `(user #ID)` stub
 * so the audit line still renders coherently. Per Phase 6 brief:
 * proper name lookup can be a follow-up.
 */
const resolveActorName = (
   name?: string | null,
   id?: number | null,
): string => {
   if (name && name.trim().length > 0) return name;
   if (id != null) return `(user #${id})`;
   return '—';
};

interface SubRequestCardProps {
   child: RequestDetails;
   departmentName: string;
   /** When true (the actor is the row's HOD and it's still pending),
    *  inline approve/decline buttons render. */
   canAct: boolean;
   onApprove?: (childId: number) => void;
   onDecline?: (childId: number) => void;
   busy?: boolean;
}

/**
 * One card per child sub-request on the parent detail page. Renders the
 * child's department, status pill, approval audit line, item list, and
 * (when the viewer is the row's HOD) inline approve / decline buttons.
 *
 * Declined children are dimmed (`opacity-60`) per Spec Q1: greyed with
 * a small reason caption, no strike-through.
 */
const SubRequestCard: React.FC<SubRequestCardProps> = ({
   child,
   departmentName,
   canAct,
   onApprove,
   onDecline,
   busy,
}) => {
   const isDeclined = child.requestStatus === 'Declined';
   const isApproved = child.requestStatus === 'Approved';
   const audit = child.audit;
   const items = audit?.items ?? [];

   const auditLine = isApproved && audit?.approvedAt
      ? `Approved by ${resolveActorName(audit.approvedByName, audit.approvedByUserId)} on ${formatReadableDate(audit.approvedAt)}`
      : isDeclined && audit?.declinedAt
      ? `Declined by ${resolveActorName(audit.declinedByName, audit.declinedByUserId)} on ${formatReadableDate(audit.declinedAt)}`
      : null;

   return (
      <div
         className={`rounded-xl p-4 border transition-all ${isDeclined ? 'opacity-60' : ''}`}
         style={{
            background: 'var(--surface-paper, #fff)',
            borderColor: 'var(--border-default, rgba(15,37,82,0.12))',
         }}
      >
         <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
               <p className="text-sm font-semibold text-[#0F2552] dark:text-white/90 truncate">
                  {departmentName}
               </p>
               {auditLine && (
                  <p
                     className="text-xs mt-0.5"
                     style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
                  >
                     {auditLine}
                  </p>
               )}
            </div>
            <StatusChip status={child.requestStatus || ''} size="sm" />
         </div>

         {isDeclined && audit?.declineReason && (
            <p
               className="text-xs italic mb-2 px-3 py-2 rounded-md"
               style={{
                  background: 'var(--surface-low, rgba(15,37,82,0.04))',
                  color: 'var(--text-secondary, #5a6478)',
               }}
            >
               Reason: &ldquo;{audit.declineReason}&rdquo;
            </p>
         )}

         {items.length > 0 && (
            <div className="mt-2">
               <p
                  className="text-[0.6rem] uppercase font-semibold tracking-wider mb-1"
                  style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}
               >
                  Items
               </p>
               <ul className="text-sm text-[#0F2552] dark:text-white/85 space-y-1">
                  {items.map((it) => (
                     <li key={`${it.itemId}-${it.id ?? ''}`} className="tabular-nums">
                        {it.itemName}{' '}
                        <span
                           className="text-xs"
                           style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
                        >
                           ({it.quantityLeased})
                        </span>
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {canAct && (
            <div className="mt-4 flex items-center gap-2 justify-end">
               <ActionButton
                  variant="outline"
                  size="sm"
                  onClick={() => onDecline?.(child.id ?? 0)}
                  disabled={busy}
               >
                  Decline
               </ActionButton>
               <ActionButton
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove?.(child.id ?? 0)}
                  disabled={busy}
               >
                  Approve
               </ActionButton>
            </div>
         )}
      </div>
   );
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
   } catch (err: unknown) {
      // Log the SSR error so the dev-server console actually surfaces
      // the cause (auth expired, API 5xx, ECONNREFUSED, etc.) instead
      // of silently passing `null` to the page and leaving the user
      // with a blank form. The client-side mount effect retries, so a
      // transient failure here doesn't lock the page into a null state.
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string; code?: string };
      // eslint-disable-next-line no-console
      console.error(
         `[request/[id]] SSR fetch failed for id=${id}:`,
         {
            status: axiosErr?.response?.status,
            code: axiosErr?.code,
            message: axiosErr?.message,
            body: axiosErr?.response?.data,
            url: `${requestConstants.REQUEST_URI}/detail/${id}`,
         },
      );
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
      serverActions: serverActionRows,
   } = useSelector((s: RootState) => s.request);
   const { userDetails, roleUsersList } = useSelector((s: RootState) => s.user);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   // Multi-role users (e.g. SA + HOD) get the union of every hat's
   // permissions for free via usePermission — kills the OR-of-hats
   // class of bugs that hid approve/decline buttons from exactly the
   // user who needed them.
   const { can } = usePermission();

   const [requestDetails, setRequestDetails] =
      useState<RequestDetails>(requestDetail);

   // Workflow Rules Module (Phase 3): the saga stores the engine's
   // verdict as a `{ action, toState, transitionId }[]` array; the
   // hook only needs the action keys.  `null` means "no verdict yet
   // — fall back to local computation" (the unchanged status quo).
   const serverActionKeys = useMemo(() => {
      if (!serverActionRows) return null;
      return serverActionRows.map((row: { action: string }) => row.action);
   }, [serverActionRows]);

   // All gating ("who can do what on this row right now?") lives in
   // useRequestActions — single source of truth, testable in isolation.
   // `serverActions` carries the engine's verdict when available; the
   // hook falls back to local computation when it's null (e.g. before
   // the saga returns, or in environments where the engine is off).
   const {
      canAssignRequest,
      hasParent,
      hasChildren,
      isMemberAssigned,
      isMemberCollected,
      canAssign,
      canActOnRow,
   } = useRequestActions({
      requestDetails,
      userDetails,
      can,
      serverActions: serverActionKeys,
   });
   const [assignedUserId, setAssignedUserId] = useState('');
   const [status, setStatus] = useState(requestDetails?.requestStatus);
   const [items, setItems] = useState(requestDetails?.audit?.items || []);

   // Re-sync local state when the SSR prop changes — i.e. when navigating
   // from /admin/request/A to /admin/request/B without a full reload.
   // Next.js re-runs getServerSideProps and passes a new `requestDetail`,
   // but `useState(initial)` only honours its argument on first mount, so
   // without this effect the page would keep rendering the stale row.
   //
   // Skip the sync when the new prop is null AND we already have data
   // locally — that situation means SSR failed (logged in
   // getServerSideProps' catch) but a client-side fetch already
   // hydrated the page. Overwriting back to null would blank the UI.
   useEffect(() => {
      if (requestDetail == null && requestDetails != null) {
         return;
      }
      setRequestDetails(requestDetail);
      setStatus(requestDetail?.requestStatus);
      setItems(requestDetail?.audit?.items ?? []);
      setAssignedUserId('');
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [requestDetail]);

   // Decline-reason modal — captures the optional `reason` body the API
   // accepts on the decline endpoint. Targets either the row currently
   // being viewed (flat row) or a specific child id when an HOD is
   // declining one sub-request from the parent's tree view.
   const [declineModalTargetId, setDeclineModalTargetId] = useState<number | null>(null);
   const [declineReason, setDeclineReason] = useState('');

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

   // Per-item return condition. Release condition is no longer captured:
   // only Good items can enter the request workflow, so there's nothing
   // to grade at release time.
   const [returnConditions, setReturnConditions] = useState<Record<number, string>>({});

   // Verify the emailed magic-link token (if one is present in the URL).
   // PrivateRoute is the primary gate — anyone reaching this page is already
   // a session-authenticated admin, so a stale token adds no risk. We strip
   // the token from the URL either way so it doesn't leak via referer /
   // history. Failures are logged for diagnostics but no longer surface as
   // a toast — the contradictory "expired … but session is active" message
   // confused users with no actionable next step.
   const verifiedRef = useRef(false);
   useEffect(() => {
      if (!router.isReady || verifiedRef.current) return;
      const token = router.query.t;
      if (!token || Array.isArray(token)) return;
      verifiedRef.current = true;

      const stripToken = () => {
         const rest = { ...router.query };
         delete rest.t;
         router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
      };

      axios
         .post(requestConstants.VERIFY_REQUEST_TOKEN_URI, { token })
         .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Request link token verification failed', err);
         })
         .finally(stripToken);
   }, [router.isReady, router.query, router]);



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
         // Workflow Rules Module (Phase 3): refresh the engine's
         // verdict alongside every detail refetch. The detail
         // response already embeds `availableActions`, but the saga
         // is the one that puts the array into Redux for the hook,
         // so we still kick off the dedicated fetch. This is the
         // post-mutation refresh path (approve / decline / assign /
         // release / return all call fetchRequestDetails on success).
         if (id != null) {
            dispatch(
               requestActions.getRequestActions({
                  id: Number(id),
               }) as unknown as UnknownAction,
            );
         }
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

   /**
    * Approve a row by id — used for both the parent's flat fallback path
    * and per-child approval when an HOD acts on one sub-request from a
    * tree view. The endpoint is the same: PATCH /request/approve/:id.
    */
   const handleApproveRow = (rowId: number) => {
      if (!rowId) return;
      dispatch(
         requestActions.updateRequestStatus({
            status: 'approve',
            requestId: String(rowId),
         }) as unknown as UnknownAction,
      );
   };

   /**
    * Open the decline-reason modal for a specific row. Submission flows
    * through `handleConfirmDecline` so the optional `reason` body is
    * captured before firing the API call.
    */
   const handleOpenDecline = (rowId: number) => {
      if (!rowId) return;
      setDeclineModalTargetId(rowId);
      setDeclineReason('');
   };

   const handleConfirmDecline = () => {
      const target = declineModalTargetId;
      if (!target) return;
      const trimmed = declineReason.trim();
      dispatch(
         requestActions.updateRequestStatus({
            status: 'decline',
            requestId: String(target),
            reason: trimmed.length > 0 ? trimmed : undefined,
         }) as unknown as UnknownAction,
      );
      setDeclineModalTargetId(null);
      setDeclineReason('');
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
         const units: SelectedUnit[] = selectedUnits[item.itemId] || [];

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
      // Pre-load the assignee picker when the viewer can actually
      // assign — that's the capability we care about, not "is SA".
      if (canAssignRequest) {
         // Hardcoded MEMBER role-id remains because the API endpoint
         // takes a roleId query param to fetch candidate assignees.
         // Identity (which users to suggest) is still role-shaped on
         // the API; capability (can the current user assign?) is now
         // permission-shaped.
         dispatch(
            userActions.getUsersByRole({ roleId: RoleId.MEMBER }) as unknown as UnknownAction
         );
      }
   }, [canAssignRequest, dispatch]);

   // Fallback: when SSR returned null (the catch in getServerSideProps
   // logs the underlying cause), retry from the client on mount so the
   // page heals itself instead of rendering an empty form. The retry
   // uses the user's actual auth token from localForage, which can
   // differ from the SSR cookie if it's been refreshed since the page
   // request was sent.
   useEffect(() => {
      if (requestDetails == null && id != null) {
         fetchRequestDetails();
      }
      // Only fires on mount — once data arrives, requestDetails is set
      // and we don't want to re-trigger from this effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // Workflow Rules Module (Phase 3): fetch the engine's verdict on
   // available actions for this request. Runs on mount and whenever
   // `id` changes (cross-route navigation). The SSR-fed detail
   // response already embeds the same array under `availableActions`,
   // but the redux saga is what stores it where the hook can read it,
   // so the explicit dispatch is still load-bearing. Reset the
   // server actions when the id changes so the hook falls back to
   // local computation until the fresh fetch lands.
   useEffect(() => {
      if (id == null) return;
      dispatch(requestActions.resetRequestActions() as unknown as UnknownAction);
      dispatch(
         requestActions.getRequestActions({
            id: Number(id),
         }) as unknown as UnknownAction,
      );
   }, [id, dispatch]);

   // The view page needs the department list to resolve
   // `fulfillingDepartmentId` -> name on each child sub-request card.
   // Avoid the round-trip if the list is already loaded.
   useEffect(() => {
      if (!allDepartmentsList || allDepartmentsList.length === 0) {
         dispatch(
            departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction,
         );
      }
   }, [dispatch, allDepartmentsList]);

   useEffect(() => {
      const listener = AppEmitter.addListener(
         requestConstants.UPDATE_REQUEST_STATUS_SUCCESS,
         (evt: Event) => {
            // The new approve/decline buttons fire status changes that
            // can resolve to Approved, Declined, or (for parents) bubble
            // up to Partially Approved. We don't try to predict the
            // resolved status here — `fetchRequestDetails` re-reads the
            // canonical state from the API and pushes it into the local
            // `status` via the same callback.
            const customEvent = evt as CustomEvent;
            if (customEvent) {
               fetchRequestDetails();
            }
         }
      );

      return () => listener.remove();
   }, [fetchRequestDetails]);

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

   // Hydrate the unit picker from the request detail's embedded
   // trackingMode + availableUnits. The API ships these inline so the
   // assignee (a Member) doesn't need items:read to populate the form —
   // see the API-side enrichment in request.service.ts:getRequest.
   useEffect(() => {
      if (!requestDetails?.audit?.items?.length) return;
      const trackingModes: Record<number, string> = {};
      const unitsOptions: Record<number, UnitOption[]> = {};
      for (const item of requestDetails.audit.items) {
         const embeddedItem = item as unknown as {
            itemId: number;
            trackingMode?: string;
            availableUnits?: {
               id: number;
               serialNumber: string;
               condition: string;
               store: { id: number } | null;
            }[];
         };
         const itemId = Number(embeddedItem.itemId);
         if (!Number.isFinite(itemId) || itemId <= 0) continue;
         trackingModes[itemId] = embeddedItem.trackingMode ?? 'Quantity';
         unitsOptions[itemId] = (embeddedItem.availableUnits ?? []).map((u) => ({
            value: u.id,
            label:
               u.condition && u.condition !== 'Not specified'
                  ? `${u.serialNumber} - ${u.condition}`
                  : u.serialNumber,
            data: {
               id: u.id,
               serialNumber: u.serialNumber,
               condition: u.condition,
               store: u.store ?? { id: 0 },
            },
         }));
      }
      setItemTrackingModes((prev) => ({ ...prev, ...trackingModes }));
      setItemUnitsOptions((prev) => ({ ...prev, ...unitsOptions }));
   }, [requestDetails?.audit?.items]);

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

   // Deps list normalised so resolve calls don't crash when the list is
   // still loading. Cast through `unknown` because the department reducer
   // uses a slightly looser type.
   const departments = useMemo<Array<{ id: number; name?: string }>>(
      () => (allDepartmentsList ?? []) as unknown as Array<{ id: number; name?: string }>,
      [allDepartmentsList],
   );

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
         <div className="md:col-span-10 md:col-start-2">
            {/* PageHeader stays full-width above the activity split so
                the page chrome (search / role switcher / etc.) doesn't
                get squeezed when the right column appears. */}
            <PageHeader />

            <div className="mt-6 space-y-6">
            {/* Back button */}
            <div className="flex items-center justify-between gap-3">
               <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-white/50 hover:text-[#0F2552] dark:hover:text-white/80 transition-colors cursor-pointer"
               >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
               </button>
            </div>

            {/* ── Slim workflow stepper ───────────────────────────────
                Smaller circles + tighter padding than the original block.
                Milestones still scan instantly but no longer eat a
                quarter of the viewport above the actual content.
                Sits at the very top of the content area so the viewer
                lands on the workflow state first. */}
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
                  <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm px-5 py-3">
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
                                 <div className="flex flex-col items-center gap-1 min-w-0">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[0.6rem] font-bold flex-shrink-0 transition-colors ${circleClass}`}>
                                       {isCompleted ? (
                                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                             <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                       ) : (
                                          idx + 1
                                       )}
                                    </div>
                                    <span className={`text-[0.55rem] leading-tight text-center whitespace-nowrap transition-colors ${labelClass}`}>
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

            {/* ── Compact identity header ──────────────────────────────
                Replaces the original tall "Header card" + the top-of-page
                Reference card. Combines requester name, status, type chip,
                request id, ministry, email, and phone into one strip so
                the top of the page tells the viewer who/what/which-state
                at a glance. The fuller Reference card (with its
                explanatory paragraph and "View parent" CTA for subs)
                lives in the right rail below — it's available without
                dominating the viewport. */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm px-5 py-4">
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                     <h1 className="text-lg font-bold text-[#0F2552] dark:text-white/90">
                        {capitalizeFirstLetter(requestDetails?.requesterName) || '—'}
                     </h1>
                     <StatusChip status={status || ''} size="sm" pulse />
                     {(() => {
                        const isSub = hasParent;
                        const isParent = hasChildren;
                        const typeLabel = isSub ? 'Sub' : isParent ? 'Main' : 'Standalone';
                        const pillStyle: React.CSSProperties = isSub
                           ? { background: '#B28309', color: '#fff' }
                           : {
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-strong)',
                             };
                        return (
                           <span
                              className="inline-flex items-center rounded-md text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5"
                              style={pillStyle}
                              title={`${typeLabel} request`}
                           >
                              {typeLabel}
                           </span>
                        );
                     })()}
                     <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: 'var(--text-secondary, #5a6478)' }}
                     >
                        #{requestDetails?.id ?? '—'}
                     </span>
                  </div>
                  {/* Spec §5.2: the description tag travels with the row
                      on every page. Surface it under the identity row so
                      context never gets lost as you scan down. */}
                  {requestDetails?.descriptionOfRequest && (
                     <p
                        className="text-sm font-medium italic max-w-3xl"
                        style={{ color: 'var(--text-secondary, #5a6478)' }}
                     >
                        &ldquo;{requestDetails.descriptionOfRequest}&rdquo;
                     </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-white/40 pt-0.5">
                     {requestDetails?.ministryName && (
                        <span className="font-medium text-gray-500 dark:text-white/55">
                           {capitalizeFirstLetter(requestDetails.ministryName)}
                        </span>
                     )}
                     {requestDetails?.requesterEmail && (
                        <span className="inline-flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                           </svg>
                           {requestDetails.requesterEmail}
                        </span>
                     )}
                     {requestDetails?.requesterPhone && (
                        <span className="inline-flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                           </svg>
                           {formatPhoneDisplay(requestDetails.requesterPhone)}
                        </span>
                     )}
                  </div>
               </div>
            </div>

            {/* ── Two-column main layout ─────────────────────────────
                Main column (8/12) carries the request body; right rail
                (4/12) carries actions, the Reference card, and parent /
                sibling context. Collapses to a single column below `lg`
                so mobile keeps the same vertical flow as before. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
               <div className="lg:col-span-8 space-y-6 min-w-0">
                  {/* Request Information — multi-column field grid.
                      Was a single tall stack of label/value rows; the
                      grid drops the section's vertical footprint by ~3×
                      and fills the column width instead of leaving half
                      of it empty. */}
                  <DetailSection title="Request Information">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 px-5 pb-3">
                        <DetailField
                           label="Ministry Name"
                           value={capitalizeFirstLetter(requestDetails?.ministryName as string)}
                        />
                        <DetailField
                           label="Requester Name"
                           value={capitalizeFirstLetter(requestDetails?.requesterName)}
                        />
                        <DetailField label="Email" value={requestDetails?.requesterEmail} />
                        <DetailField
                           label="Phone"
                           value={formatPhoneDisplay(requestDetails?.requesterPhone)}
                        />
                        <DetailField
                           label="Location"
                           value={capitalizeFirstLetter(requestDetails?.locationOfUse)}
                        />
                        <DetailField
                           label="Return Date"
                           value={
                              status === 'Collected'
                                 ? formatReadableDate(requestDetails?.audit.collectedDate)
                                 : formatReadableDate(
                                      status === 'Completed'
                                         ? requestDetails?.audit.completedDate
                                         : requestDetails?.dateOfReturn,
                                   )
                           }
                        />
                        <DetailField
                           label="Assigned Member"
                           value={requestDetails?.audit.assigneeName}
                        />
                        {/* Description spans the full row — long-form text
                            doesn't fit a 1/3 column without truncation. */}
                        <DetailField
                           label="Description"
                           value={capitalizeFirstLetter(requestDetails?.descriptionOfRequest)}
                           className="sm:col-span-2 lg:col-span-3"
                        />
                     </div>
                  </DetailSection>

            {/* ── Sub-requests (parent rows only) ─────────────────────────
                Spec §5.2 / §11 Phase 6: on a parent the items section is
                replaced with one card per child sub-request. The card
                shows the child's department, its current status pill,
                approval audit, and item subset. HODs whose dept owns a
                child see inline approve / decline buttons. */}
            {hasChildren && (
               <DetailSection title="Sub-requests">
                  <div className="space-y-3 p-4">
                     {(requestDetails.children ?? []).map((child) => {
                        const deptName = resolveDepartmentName(child, departments);
                        const showActions = canActOnRow(child);
                        return (
                           <SubRequestCard
                              key={child.id}
                              child={child}
                              departmentName={deptName}
                              canAct={showActions}
                              onApprove={handleApproveRow}
                              onDecline={handleOpenDecline}
                              busy={IsUpdatingRequestStatus}
                           />
                        );
                     })}
                  </div>
               </DetailSection>
            )}

            {/* ── Requested Items ─────────────────────────────────────────────────────── */}
            {/* Show whenever there are items to render. Pre-assignment a
                multi-dept parent has `audit.items = []` (items live on each
                child via the Sub-requests cards above) so the section
                stays hidden. At assignment time the API aggregates the
                approved children's items onto the parent's audit so the
                assignee has a single bundle to release / return — gating
                on `audit.items.length` lets the same section serve both
                flat rows and post-assignment parents without a separate
                code path. */}
            {(requestDetails?.audit?.items?.length ?? 0) > 0 && (
            <DetailSection title="Requested Items">
               {/* Card-based layout for MEMBER action states */}
               {(isMemberAssigned || isMemberCollected) ? (
                  <div className="space-y-3 p-4">
                     {requestDetails?.audit?.items && requestDetails.audit.items.map((item, index) => {
                        const isSerialized = itemTrackingModes[item.itemId] === 'Serialized';
                        const selectedCount = selectedUnits[item.itemId]?.length ?? 0;
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

                                 {/* Condition dropdown — only on RETURN (member-collected) for quantity items.
                                     Bad items can't enter requests, so asking for condition on release is
                                     meaningless. On return the requester may be handing it back in bad
                                     shape, so this is where the field matters. */}
                                 {!isSerialized && isMemberCollected && (
                                    <div className="flex flex-col gap-1 min-w-[160px]">
                                       <label className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                          Condition
                                       </label>
                                       <SmallSelect
                                          options={conditionOptions}
                                          value={returnCondition}
                                          placeholder="Select condition"
                                          onChange={(val) => {
                                             setReturnConditions((prev) => ({ ...prev, [item.itemId]: val as string }));
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

                                    {/* Selected-units list. On release (member-assigned) we just confirm
                                        the chosen serials — no condition editor, since Bad units can't
                                        be requested in the first place. On return (member-collected)
                                        the assignee grades each unit Good / Bad. */}
                                    {(selectedUnits[item.itemId]?.length ?? 0) > 0 && (
                                       <div className="mt-2 space-y-1.5">
                                          <p className="text-[0.6rem] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-hint, rgba(15,37,82,0.45))' }}>
                                             {isMemberCollected ? 'Returning Units' : 'Selected Units'}
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
                                                {isMemberCollected && (
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
                                                )}
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
            )}

               </div>
               {/* End of left column ──────────────────────────────────── */}

               {/* ── Right rail ─────────────────────────────────────────
                   Reference card (compact) + the action panel + sibling
                   strip. Action panel is sticky on lg so HODs / SAs can
                   approve / decline / assign without scrolling back up
                   on long item lists. */}
               <div className="lg:col-span-4 space-y-6 min-w-0">
                  {/* Compact Reference card. Same content as the
                      previous top-of-page card but rail-sized — pill +
                      id, explanatory paragraph, and (for subs) the
                      "View parent" CTA + parent summary. */}
                  {(() => {
                     const parentId =
                        requestDetails?.parent?.id ?? requestDetails?.parentId ?? null;
                     const goToParent = () => {
                        if (parentId == null) return;
                        router.push(
                           { pathname: '/admin/request/[id]', query: { id: parentId } },
                           `/admin/request/${parentId}`,
                        );
                     };
                     const isSub = hasParent;
                     const isParent = hasChildren;
                     const typeLabel = isSub
                        ? 'Sub-request'
                        : isParent
                          ? 'Main request'
                          : 'Standalone request';
                     const pillStyle: React.CSSProperties = isSub
                        ? { background: '#B28309', color: '#fff' }
                        : {
                             background: 'transparent',
                             color: 'var(--text-secondary)',
                             border: '1px solid var(--border-strong)',
                          };
                     const explanation = isSub
                        ? 'This request belongs to a parent and was created automatically because the original request needed items from this department. Approving or declining it only affects this department’s portion — siblings in other departments are decided independently.'
                        : isParent
                          ? 'This is the main request. It spans more than one department, so each department fulfils its share through its own sub-request below. The status here is computed from the children — once they all settle, this row updates.'
                          : 'This request is fulfilled entirely by a single department, so it has no sub-requests. The number below is its own reference id.';
                     return (
                        <div
                           className="rounded-xl border px-4 py-3"
                           style={{
                              background: 'var(--surface-low, rgba(15,37,82,0.04))',
                              borderColor: 'var(--border-default, rgba(15,37,82,0.12))',
                           }}
                        >
                           <div className="flex items-center gap-2 mb-2">
                              <span
                                 className="inline-flex items-center rounded-md text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5"
                                 style={pillStyle}
                              >
                                 {typeLabel}
                              </span>
                              <span
                                 className="font-mono text-xs font-semibold ml-auto"
                                 style={{ color: 'var(--text-secondary, #5a6478)' }}
                              >
                                 #{requestDetails?.id ?? '—'}
                              </span>
                           </div>
                           <p
                              className="text-xs leading-relaxed"
                              style={{ color: 'var(--text-secondary, #5a6478)' }}
                           >
                              {explanation}
                           </p>
                           {isSub && parentId != null && (
                              <button
                                 type="button"
                                 onClick={goToParent}
                                 className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                                 style={{ background: '#B28309', color: '#fff' }}
                                 title={`Open parent request #${parentId}`}
                              >
                                 View parent
                                 <span className="font-mono">#{parentId}</span>
                                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                 </svg>
                              </button>
                           )}
                           {isSub && requestDetails?.parent && (
                              <div
                                 className="mt-3 pt-3 text-xs"
                                 style={{
                                    borderTop:
                                       '1px solid var(--border-default, rgba(15,37,82,0.08))',
                                    color: 'var(--text-secondary, #5a6478)',
                                 }}
                              >
                                 <span
                                    className="block text-[0.6rem] uppercase font-semibold tracking-wider mb-0.5"
                                    style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
                                 >
                                    Parent
                                 </span>
                                 <span className="text-[#0F2552] dark:text-white/85 font-medium">
                                    {capitalizeFirstLetter(requestDetails.parent.requesterName) || '—'}
                                 </span>
                                 {requestDetails.parent.ministryName && (
                                    <>
                                       &nbsp;&middot;&nbsp;
                                       {capitalizeFirstLetter(requestDetails.parent.ministryName)}
                                    </>
                                 )}
                                 {requestDetails.parent.descriptionOfRequest && (
                                    <p
                                       className="italic mt-1"
                                       style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
                                    >
                                       &ldquo;{requestDetails.parent.descriptionOfRequest}&rdquo;
                                    </p>
                                 )}
                              </div>
                           )}
                        </div>
                     );
                  })()}

                  {/* Sticky action stack — anchors the primary CTA so a
                      reviewer scrolling down a long item list can still
                      see what to do next without scrolling back up. */}
                  <div className="lg:sticky lg:top-4 space-y-6">
                     {/* Action panel — same role-conditional logic as
                         before, restyled to stack vertically in the
                         narrower right rail. */}
                     {(canAssign ||
                        canActOnRow(requestDetails) ||
                        isMemberAssigned ||
                        isMemberCollected) && (
                        // Custom card (not DetailSection) so the dropdown
                        // popover isn't clipped by `overflow-hidden` —
                        // CustomDropdownSelect renders its option list
                        // absolutely-positioned and gets cut off inside
                        // a clipped section.
                        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 shadow-sm">
                           <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
                              <h3 className="text-sm font-semibold text-[#0F2552] dark:text-white/90">Actions</h3>
                           </div>
                           <div className="p-4 space-y-3">
                              {canAssign && (
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
                                    {requestDetails?.requestStatus === 'Partially Approved' && (
                                       <p
                                          className="text-[0.7rem] mt-1.5"
                                          style={{ color: 'var(--text-hint, rgba(15,37,82,0.55))' }}
                                       >
                                          Only approved sub-requests are included.
                                       </p>
                                    )}
                                 </div>
                              )}

                              {/* Buttons stack vertically in the rail —
                                  full-width so they read as primary CTAs. */}
                              <div className="flex flex-col gap-2">
                                 {isMemberAssigned ? (
                                    <ActionButton
                                       onClick={handleReleaseRequestItems}
                                       variant="primary"
                                       size="md"
                                       disabled={releaseButtonDisabled}
                                       className="w-full justify-center"
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
                                       className="w-full justify-center"
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
                                 ) : canActOnRow(requestDetails) ? (
                                    // HOD acting on a flat row or child:
                                    // Approve is the primary CTA, Decline
                                    // is the destructive secondary.
                                    <>
                                       <ActionButton
                                          variant="primary"
                                          size="md"
                                          onClick={() => handleApproveRow(Number(requestDetails?.id ?? id))}
                                          disabled={IsUpdatingRequestStatus}
                                          className="w-full justify-center"
                                       >
                                          {IsUpdatingRequestStatus ? (
                                             <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                             </div>
                                          ) : (
                                             'Approve'
                                          )}
                                       </ActionButton>
                                       <ActionButton
                                          variant="outline"
                                          size="md"
                                          onClick={() => handleOpenDecline(Number(requestDetails?.id ?? id))}
                                          disabled={IsUpdatingRequestStatus}
                                          className="w-full justify-center"
                                       >
                                          Decline
                                       </ActionButton>
                                    </>
                                 ) : canAssign ? (
                                    <ActionButton
                                       onClick={handleAssignRequest}
                                       disabled={assignedUserId === ''}
                                       variant="primary"
                                       size="md"
                                       className="w-full justify-center"
                                    >
                                       {IsAssigningRequest ? (
                                          <div className="flex items-center gap-2">
                                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                             Processing...
                                          </div>
                                       ) : (
                                          'Assign'
                                       )}
                                    </ActionButton>
                                 ) : null}
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Sibling sub-requests strip — child detail view
                         only. Shows other children of the parent so a
                         non-Facility HOD acting on one child has
                         at-a-glance context for the rest of the tree.
                         Single-column in the rail (was 2-column on the
                         old full-width layout). Read-only by design
                         (Spec §5.2). */}
                     {hasParent &&
                        requestDetails?.parent?.children &&
                        requestDetails.parent.children.length > 1 && (
                           <DetailSection title="Sibling sub-requests">
                              <div className="p-3 space-y-2">
                                 {requestDetails.parent.children
                                    .filter((sib) => sib.id !== requestDetails.id)
                                    .map((sib) => {
                                       const sibDept = resolveDepartmentName(sib, departments);
                                       return (
                                          <div
                                             key={sib.id}
                                             className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                                             style={{
                                                background:
                                                   'var(--surface-low, rgba(15,37,82,0.04))',
                                                border:
                                                   '1px solid var(--border-default, rgba(15,37,82,0.08))',
                                             }}
                                          >
                                             <span className="text-sm text-[#0F2552] dark:text-white/85 truncate">
                                                {sibDept}
                                             </span>
                                             <StatusChip
                                                status={sib.requestStatus || ''}
                                                size="sm"
                                             />
                                          </div>
                                       );
                                    })}
                              </div>
                           </DetailSection>
                        )}
                  </div>
               </div>
               {/* End of right rail ─────────────────────────────────────── */}
            </div>
            {/* End of two-column main layout ─────────────────────────── */}

            {/* Decline-reason modal — captures the optional `reason`
                body the API accepts on the decline endpoint (Phase 3).
                Reuses the shared `ModalWrapper` so the dialog matches
                every other modal in the app. */}
            <ModalWrapper
               open={declineModalTargetId != null}
               onClose={() => {
                  setDeclineModalTargetId(null);
                  setDeclineReason('');
               }}
               title="Decline sub-request"
               subtitle="Add an optional reason — it will be visible to the requester and other HODs on the request."
            >
               <div className="space-y-4">
                  <textarea
                     className="w-full text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#B28309]/30"
                     style={{
                        background: 'var(--surface-low, rgba(15,37,82,0.04))',
                        border: '1.5px solid var(--border-default, rgba(15,37,82,0.18))',
                        color: 'var(--text-primary, #0F2552)',
                        minHeight: '6rem',
                     }}
                     placeholder="e.g. Out of stock for the requested period"
                     value={declineReason}
                     onChange={(e) => setDeclineReason(e.target.value)}
                     maxLength={500}
                  />
                  <div className="flex items-center justify-end gap-2">
                     <ActionButton
                        variant="ghost"
                        size="md"
                        onClick={() => {
                           setDeclineModalTargetId(null);
                           setDeclineReason('');
                        }}
                     >
                        Cancel
                     </ActionButton>
                     <ActionButton
                        variant="secondary"
                        size="md"
                        onClick={handleConfirmDecline}
                        disabled={IsUpdatingRequestStatus}
                     >
                        Confirm decline
                     </ActionButton>
                  </div>
               </div>
            </ModalWrapper>
            </div>
         </div>
      </Layout>
   );
};

export default RequestViewPage;
