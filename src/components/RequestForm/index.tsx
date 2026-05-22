import React, { FC, useCallback, useEffect, useState } from 'react';
import ItemDetails, { ItemRow } from './ItemDetails';

import RequestDetails from './RequestDetails';
import MoreInformation from './MoreInformation';
import { useDispatch, useSelector } from 'react-redux';
import { appActions, departmentActions, requestActions } from '@/actions';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { itemConstants, requestConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { Item, RequestForm as RequestFormPayload } from '@/types';

const steps = ['Item(s) Details', 'Requester Details', 'More Information'];

const newRowKey = () =>
   `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const blankRow = (): ItemRow => ({
   rowKey: newRowKey(),
   departmentId: null,
   departmentName: null,
   itemId: null,
   name: '',
   availableQuantity: 0,
   requestedQuantity: 0,
});

interface FormData {
   items: ItemRow[];
   // Description moved up from the previous Step 3 (MoreInformation).
   // It's mandatory now (min length 5) because alien HODs need that
   // context to approve a child of someone else's request — see Spec §7.
   descriptionOfRequest: string;
   requestDetails: {
      ministryName: string;
      requesterName: string;
      email: string;
      contactNumber: string;
      ownDepartmentId: string;
   };
   moreInformation: {
      location: string;
      returnDate: string;
      dateOfCollection: string;
   };
}

interface RequestFormProps {
   route: string;
}

const RequestForm: FC<RequestFormProps> = ({ route }) => {
   const isWorkerRoute = route.includes('egfm-worker');

   const dispatch = useDispatch();
   const { IsCreatingRequest } = useSelector((s: RootState) => s.request);
   const { userDetails } = useSelector((s: RootState) => s.user);
   const [currentStep, setCurrentStep] = useState(0);
   const [isFormValid, setIsFormValid] = useState(true);
   const [showDescriptionError, setShowDescriptionError] = useState(false);
   const [showItemRowErrors, setShowItemRowErrors] = useState(false);
   const [formData, setFormData] = useState<FormData>({
      items: [blankRow()],
      descriptionOfRequest: '',
      requestDetails: {
         ministryName: '',
         requesterName: '',
         email: '',
         contactNumber: '',
         ownDepartmentId: '',
      },
      moreInformation: {
         location: '',
         returnDate: '',
         dateOfCollection: '',
      },
   });

   // Form-level item cache, keyed by departmentId. The shared redux
   // `allDepartmentItemsList` slice is overwritten on every dispatch, so
   // it can't safely back two rows on different departments at the same
   // time. We bypass the slice and fetch directly per-dept, caching the
   // result here so we only hit the server once per dept regardless of
   // how many rows pick the same dept.
   const [itemsByDept, setItemsByDept] = useState<Record<number, Item[]>>({});
   const [loadingDepts, setLoadingDepts] = useState<Record<number, boolean>>({});

   const fetchItemsForDept = useCallback(
      async (deptId: number) => {
         if (itemsByDept[deptId] || loadingDepts[deptId]) return;
         setLoadingDepts((prev) => ({ ...prev, [deptId]: true }));
         try {
            const res = await fetch(`${itemConstants.ITEM_URI}/all/${deptId}`, {
               method: 'GET',
               mode: 'cors',
               headers: { Accept: 'application/json' },
            });
            if (!res.ok) {
               throw new Error(`Failed to load items for department ${deptId}`);
            }
            const json = (await res.json()) as { data?: Item[] };
            setItemsByDept((prev) => ({ ...prev, [deptId]: json?.data ?? [] }));
         } catch {
            // Mark as empty so we don't keep retrying on every render.
            setItemsByDept((prev) => ({
               ...prev,
               [deptId]: prev[deptId] ?? [],
            }));
         } finally {
            setLoadingDepts((prev) => {
               const next = { ...prev };
               delete next[deptId];
               return next;
            });
         }
      },
      [itemsByDept, loadingDepts],
   );

   // Default the requester's own department to the logged-in user's
   // department once that's available. Only fires if the user hasn't
   // already typed a value, so we don't clobber an explicit choice.
   useEffect(() => {
      const userDeptId = userDetails?.departmentId;
      if (
         userDeptId != null &&
         !formData.requestDetails.ownDepartmentId
      ) {
         setFormData((prev) => ({
            ...prev,
            requestDetails: {
               ...prev.requestDetails,
               ownDepartmentId: String(userDeptId),
            },
         }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [userDetails?.departmentId]);

   useEffect(() => {
      dispatch(departmentActions.getUnpaginatedDepartments() as unknown as UnknownAction);
   }, [dispatch]);

   useEffect(() => {
      const listener = AppEmitter.addListener(
         requestConstants.CREATE_REQUEST_SUCCESS,
         (evt: Event) => {
            const customEvent = evt as CustomEvent;
            if (!customEvent) return;

            // Reset the wizard to step 1 and clear form state synchronously on
            // success — decoupled from modal lifecycle so early dismissal doesn't
            // cancel the reset.
            setCurrentStep(0);
            setShowDescriptionError(false);
            setShowItemRowErrors(false);
            setItemsByDept({});
            setLoadingDepts({});
            setFormData({
               items: [blankRow()],
               descriptionOfRequest: '',
               requestDetails: {
                  ministryName: '',
                  requesterName: '',
                  email: '',
                  contactNumber: '',
                  ownDepartmentId: userDetails?.departmentId
                     ? String(userDetails.departmentId)
                     : '',
               },
               moreInformation: {
                  location: '',
                  returnDate: '',
                  dateOfCollection: '',
               },
            });

            if (typeof window !== 'undefined') {
               window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Success feedback via the shared snackbar (matches the error
            // path in `handleSagaError` and keeps a single feedback channel
            // across all forms). The full SuccessModal was removed; the
            // form is a full-page wizard so there's no modal to close —
            // the field reset above is what "closing" means here.
            dispatch(
               appActions.setSnackBar({
                  type: 'success',
                  message: 'Request submitted successfully. A ticket has been sent to your mail.',
                  variant: 'success',
               }) as unknown as UnknownAction,
            );
         },
      );

      return () => listener.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const isStep1Valid = () => {
      const descOk = formData.descriptionOfRequest.trim().length >= 5;
      const itemsOk =
         formData.items.length > 0 &&
         formData.items.every(
            (i) =>
               i.departmentId != null &&
               i.itemId != null &&
               (i.requestedQuantity || 0) >= 1,
         );
      return descOk && itemsOk;
   };

   const canProceedStep = () => {
      if (currentStep === 0) {
         return isStep1Valid();
      }
      if (currentStep === 1) {
         // Validate requester details step
         const { ministryName, requesterName, email, contactNumber, ownDepartmentId } =
            formData.requestDetails;
         // If isWorkerRoute, ministryName may not be required
         return (
            (isWorkerRoute || ministryName) &&
            requesterName &&
            email &&
            contactNumber &&
            ownDepartmentId
         );
      }
      if (currentStep === 2) {
         // Validate more information step. Both dates must be in the future
         // (or today), and the return must be on or after the collection.
         // The form surfaces violations inline; this is the backstop.
         const { location, returnDate, dateOfCollection } = formData.moreInformation;
         if (!location || !returnDate || !dateOfCollection) return false;
         const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
         const c = new Date(dateOfCollection).getTime();
         const r = new Date(returnDate).getTime();
         if (!Number.isFinite(c) || !Number.isFinite(r)) return false;
         if (c < startOfToday || r < startOfToday) return false;
         if (r < c) return false;
         return true;
      }
      return true;
   };

   const handleNext = () => {
      if (currentStep === 0) {
         // Step 1 has multiple validation surfaces (description + per-row
         // dept/item/qty). Flip the inline error flags so the form shows
         // *what's wrong* rather than just disabling Continue silently.
         const descOk = formData.descriptionOfRequest.trim().length >= 5;
         const itemsOk = formData.items.every(
            (i) =>
               i.departmentId != null &&
               i.itemId != null &&
               (i.requestedQuantity || 0) >= 1,
         );
         if (!descOk) setShowDescriptionError(true);
         if (!itemsOk) setShowItemRowErrors(true);
         if (!descOk || !itemsOk) {
            dispatch(
               appActions.setSnackBar({
                  type: 'warning',
                  message: !descOk
                     ? 'Please add a description of at least 5 characters.'
                     : 'Please pick a department, item, and quantity for every row.',
                  variant: 'warning',
               }) as unknown as UnknownAction,
            );
            return;
         }
      }
      if (!canProceedStep()) {
         dispatch(
            appActions.setSnackBar({
               type: 'warning',
               message: 'Please fill all required fields before continuing.',
               variant: 'warning',
            }) as unknown as UnknownAction,
         );
         return;
      }
      if (currentStep < steps.length - 1) {
         setCurrentStep(currentStep + 1);
      }
   };

   const handleBack = () => {
      if (currentStep > 0) {
         setCurrentStep(currentStep - 1);
      }
   };

   const addItem = () => {
      setFormData((prev) => ({
         ...prev,
         items: [...prev.items, blankRow()],
      }));
   };

   const handleSubmit = async () => {
      // Build the v2 payload. Server groups items by departmentId — one
      // group → flat request, multi-group → parent + N children. See
      // Multi-Department Requests Spec §7.3.
      //
      // NOTE: file uploads (church-letter image) are NOT carried by this
      // submission path. v2 is JSON-only. If we need to re-introduce a
      // letter, that's a follow-up — either bring back the multipart v1
      // saga as a parallel "with-attachment" branch, or sign + upload
      // separately and pass a URL alongside.
      const requestData: RequestFormPayload = {
         requesterName: formData.requestDetails.requesterName,
         requesterEmail: formData.requestDetails.email,
         requesterPhone: formData.requestDetails.contactNumber,
         isMinistry: isWorkerRoute ? true : false,
         ministryName: formData.requestDetails.ministryName,
         requesterOwnDepartmentId: formData.requestDetails.ownDepartmentId
            ? Number(formData.requestDetails.ownDepartmentId)
            : undefined,
         locationOfUse: formData.moreInformation.location,
         dateOfCollection: formData.moreInformation.dateOfCollection,
         dateOfReturn: formData.moreInformation.returnDate,
         descriptionOfRequest: formData.descriptionOfRequest.trim(),
         items: formData.items
            .filter(
               (i) =>
                  i.departmentId != null &&
                  i.itemId != null &&
                  (i.requestedQuantity || 0) >= 1,
            )
            .map((i) => ({
               departmentId: i.departmentId as number,
               itemId: i.itemId as number,
               quantity: i.requestedQuantity || 0,
            })),
      };

      dispatch(
         requestActions.createRequest(requestData) as unknown as UnknownAction,
      );
   };

   const canSubmit = () => {
      const { items, requestDetails, moreInformation, descriptionOfRequest } = formData;
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
      const c = moreInformation.dateOfCollection
         ? new Date(moreInformation.dateOfCollection).getTime()
         : NaN;
      const r = moreInformation.returnDate
         ? new Date(moreInformation.returnDate).getTime()
         : NaN;
      const datesOk =
         Number.isFinite(c) &&
         Number.isFinite(r) &&
         c >= startOfToday &&
         r >= startOfToday &&
         r >= c;
      const itemsOk =
         items.length > 0 &&
         items.every(
            (i) =>
               i.departmentId != null &&
               i.itemId != null &&
               (i.requestedQuantity || 0) >= 1,
         );
      return (
         itemsOk &&
         descriptionOfRequest.trim().length >= 5 &&
         (isWorkerRoute || requestDetails.ministryName) &&
         requestDetails.requesterName &&
         requestDetails.email &&
         requestDetails.contactNumber &&
         requestDetails.ownDepartmentId &&
         moreInformation.location &&
         datesOk
      );
   };

   const setItems = (items: ItemRow[]) =>
      setFormData((prev) => ({ ...prev, items }));

   const setDescription = (descriptionOfRequest: string) => {
      setFormData((prev) => ({ ...prev, descriptionOfRequest }));
      // First keystroke after a failed submit attempt clears the inline
      // error — it's annoying to keep showing red while the user types
      // the fix.
      if (showDescriptionError && descriptionOfRequest.trim().length >= 5) {
         setShowDescriptionError(false);
      }
   };

   return (
      <>
         <div
            className="w-full max-w-2xl mx-auto rounded-xl transition-all"
            style={{ background: 'var(--surface-paper)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-md)' }}
         >
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-4">
               <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Request Form
               </h1>
               <p className="text-xs" style={{ color: 'var(--text-hint)' }}>
                  Complete all steps to submit your request
               </p>
            </div>

            {/* ── Stepper ── */}
            <div className="px-6 pb-5">
               <div className="flex items-center">
                  {steps.map((step, index) => {
                     const isCompleted = index < currentStep;
                     const isActive = index === currentStep;
                     return (
                        <React.Fragment key={index}>
                           <div className="flex items-center gap-2.5">
                              {/* Step circle */}
                              <div
                                 className="w-7 h-7 rounded-full flex items-center justify-center text-[0.65rem] font-bold shrink-0 transition-all"
                                 style={{
                                    background: isCompleted
                                       ? 'var(--color-secondary)'
                                       : isActive
                                          ? 'var(--color-secondary)'
                                          : 'var(--surface-medium)',
                                    color: isCompleted || isActive ? '#fff' : 'var(--text-hint)',
                                 }}
                              >
                                 {isCompleted ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                       <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                 ) : (
                                    index + 1
                                 )}
                              </div>
                              {/* Step label */}
                              <span
                                 className="text-[0.7rem] font-semibold whitespace-nowrap hidden sm:block"
                                 style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-hint)' }}
                              >
                                 {step}
                              </span>
                           </div>
                           {/* Connector line */}
                           {index < steps.length - 1 && (
                              <div
                                 className="flex-1 h-[2px] mx-3 rounded-full transition-all"
                                 style={{
                                    background: isCompleted ? 'var(--color-secondary)' : 'var(--surface-high)',
                                 }}
                              />
                           )}
                        </React.Fragment>
                     );
                  })}
               </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)' }} />

            {/* ── Step Content ── */}
            <div className="px-6 py-5 animate-fade-up relative z-10">
               {/* Step subtitle */}
               <p className="text-[0.6rem] uppercase font-semibold tracking-wider mb-3" style={{ color: 'var(--text-hint)' }}>
                  Step {currentStep + 1} of {steps.length} — {steps[currentStep]}
               </p>

               {currentStep === 0 && (
                  <ItemDetails
                     items={formData.items}
                     setItems={setItems}
                     addItem={addItem}
                     description={formData.descriptionOfRequest}
                     setDescription={setDescription}
                     descriptionError={showDescriptionError}
                     showRowErrors={showItemRowErrors}
                     itemsByDept={itemsByDept}
                     loadingDepts={loadingDepts}
                     fetchItemsForDept={fetchItemsForDept}
                  />
               )}
               {currentStep === 1 && (
                  <RequestDetails
                     data={formData.requestDetails}
                     setData={(requestDetails) =>
                        setFormData((prev) => ({ ...prev, requestDetails }))
                     }
                     isWorkerRoute={isWorkerRoute}
                     setIsFormValid={setIsFormValid}
                  />
               )}
               {currentStep === 2 && (
                  <MoreInformation
                     data={formData.moreInformation}
                     setData={(moreInformation) =>
                        setFormData((prev) => ({ ...prev, moreInformation }))
                     }
                  />
               )}
            </div>

            {/* ── Footer ── */}
            <div
               className="flex justify-between items-center px-6 py-4"
               style={{ borderTop: '1px solid var(--border-default)', background: 'var(--surface-low)' }}
            >
               <button
                  onClick={handleBack}
                  className={`px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                     currentStep === 0 ? 'invisible' : ''
                  }`}
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                  disabled={currentStep === 0}
               >
                  Back
               </button>

               {currentStep < steps.length - 1 ? (
                  <button
                     onClick={handleNext}
                     disabled={(currentStep !== 0 && (!canProceedStep() || !isFormValid))}
                     className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     Continue
                  </button>
               ) : (
                  <button
                     onClick={handleSubmit}
                     disabled={!canSubmit() || IsCreatingRequest}
                     className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingRequest ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Submitting...
                        </span>
                     ) : (
                        'Submit Request'
                     )}
                  </button>
               )}
            </div>
         </div>
      </>
   );
};

export default RequestForm;
