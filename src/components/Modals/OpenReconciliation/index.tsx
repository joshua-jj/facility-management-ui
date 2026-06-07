import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Formsy from 'formsy-react';
import SelectInput from '@/components/Inputs/SelectInput';
import TextArea from '@/components/Inputs/TextArea';
import ModalWrapper from '../ModalWrapper';
import { categoryActions, departmentActions, reconciliationActions } from '@/actions';
import {
   Category,
   Department,
   OpenReconciliationPayload,
   ReconciliationScopeType,
   ReconciliationSession,
} from '@/types';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { reconciliationConstants } from '@/constants';

interface OpenReconciliationProps {
   children?: ReactNode;
   className?: string;
   open?: boolean;
   onClose?: () => void;
}

interface OpenReconciliationFormData {
   scopeType: ReconciliationScopeType;
   departmentId?: string;
   categoryId?: string;
   note?: string;
}

const SCOPE_OPTIONS: { value: ReconciliationScopeType; label: string }[] = [
   { value: 'DEPARTMENT', label: 'Department' },
   { value: 'CATEGORY', label: 'Category' },
];

const OpenReconciliation: React.FC<OpenReconciliationProps> = ({
   className,
   children,
   open,
   onClose,
}) => {
   const dispatch = useDispatch();
   const router = useRouter();

   const { IsOpeningReconciliation } = useSelector((s: RootState) => s.reconciliation);
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allCategoriesList } = useSelector((s: RootState) => s.category);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   // Controlled selects so we can swap the scoped id field on scope change.
   const [scopeType, setScopeType] = useState<ReconciliationScopeType>('DEPARTMENT');
   const [departmentId, setDepartmentId] = useState<string>('');
   const [categoryId, setCategoryId] = useState<string>('');

   const isOpen = open || isModalOpen;

   const resetForm = useCallback(() => {
      setScopeType('DEPARTMENT');
      setDepartmentId('');
      setCategoryId('');
      formRef.current?.reset();
   }, []);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      resetForm();
      if (onClose) onClose();
   }, [onClose, resetForm]);

   // Load department + category lists when the modal opens (only if empty).
   useEffect(() => {
      if (!isOpen) return;
      if ((allDepartmentsList?.length ?? 0) === 0) {
         dispatch(departmentActions.getAllDepartments({ limit: 200 }) as unknown as UnknownAction);
      }
      if ((allCategoriesList?.length ?? 0) === 0) {
         dispatch(categoryActions.getCategories() as unknown as UnknownAction);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isOpen]);

   // On a successful open, the saga emits the created session — redirect to it.
   useEffect(() => {
      const listener = (evt: Event) => {
         const session = (evt as CustomEvent<ReconciliationSession>).detail;
         closeModal();
         if (session?.id != null) {
            router.push(`/admin/reconciliation/${session.id}`);
         }
      };
      const subscription = AppEmitter.addListener(
         reconciliationConstants.OPEN_RECONCILIATION_SUCCESS,
         listener,
      );
      return () => {
         subscription.remove();
      };
   }, [closeModal, router]);

   const departmentOptions = useMemo(
      () =>
         (allDepartmentsList ?? []).map((d: Department) => ({
            value: String(d.id),
            label: d.name,
         })),
      [allDepartmentsList],
   );

   const categoryOptions = useMemo(
      () =>
         (allCategoriesList ?? []).map((c: Category) => ({
            value: String(c.id),
            label: c.name,
         })),
      [allCategoriesList],
   );

   const handleScopeChange = (val: string) => {
      const next = val as ReconciliationScopeType;
      setScopeType(next);
      // Clear the now-irrelevant id so a stale value never leaks into the payload.
      if (next === 'DEPARTMENT') setCategoryId('');
      else setDepartmentId('');
   };

   const handleSubmit = (data: OpenReconciliationFormData) => {
      // Only include the id matching the chosen scope.
      const payload: OpenReconciliationPayload = {
         scopeType,
         note: data.note?.trim() ? data.note.trim() : undefined,
      };
      if (scopeType === 'DEPARTMENT' && departmentId) {
         payload.departmentId = Number(departmentId);
      } else if (scopeType === 'CATEGORY' && categoryId) {
         payload.categoryId = Number(categoryId);
      }
      dispatch(reconciliationActions.openReconciliation(payload) as unknown as UnknownAction);
   };

   // The scoped id is required for whichever scope is active.
   const scopeIdMissing =
      (scopeType === 'DEPARTMENT' && !departmentId) || (scopeType === 'CATEGORY' && !categoryId);

   return (
      <>
         {children !== undefined && (
            <span className={className} onClick={openModal} role="button" tabIndex={0}>
               {children}
            </span>
         )}

         <ModalWrapper
            open={isOpen}
            onClose={closeModal}
            title="Open Count Session"
            subtitle="Start a new inventory reconciliation count"
            width="sm:w-[34rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-2"
            >
               <SelectInput
                  name="scopeType"
                  label="Scope"
                  placeholder="Select scope"
                  options={SCOPE_OPTIONS}
                  value={scopeType}
                  onValueChange={handleScopeChange}
                  searchable={false}
                  required
               />

               {scopeType === 'DEPARTMENT' ? (
                  <SelectInput
                     name="departmentId"
                     label="Department"
                     placeholder="Select department"
                     options={departmentOptions}
                     value={departmentId}
                     onValueChange={(val) => setDepartmentId(val)}
                     searchable
                     required
                  />
               ) : (
                  <SelectInput
                     name="categoryId"
                     label="Category"
                     placeholder="Select category"
                     options={categoryOptions}
                     value={categoryId}
                     onValueChange={(val) => setCategoryId(val)}
                     searchable
                     required
                  />
               )}

               <TextArea
                  type="text"
                  name="note"
                  label="Note"
                  placeholder="Optional note for this count session"
                  required={false}
                  rows={3}
               />

               <div
                  className="flex justify-end pt-3 mt-2"
                  style={{ borderTop: '1px solid var(--border-default)' }}
               >
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit || scopeIdMissing || !!IsOpeningReconciliation}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsOpeningReconciliation ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Opening...
                        </span>
                     ) : (
                        'Open Session'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default OpenReconciliation;
