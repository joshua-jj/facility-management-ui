import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Formsy from 'formsy-react';
import DateInput from '@/components/Inputs/DateInput';
import SelectInput from '@/components/Inputs/SelectInput';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import {
   departmentActions,
   incidenceLogActions,
   meetingLocationActions,
} from '@/actions';
import { incidenceLogConstants, userConstants } from '@/constants';
import { RoleId } from '@/constants/roles.constant';
import type { IncidenceLog, IncidenceLogForm } from '@/types/incidenceLog';
import { format, parseISO } from 'date-fns';

const FACILITY_DEPARTMENT_NAME = 'Facility';

interface FacilityMember {
   id: number;
   firstName: string;
   lastName: string;
   email?: string;
}

interface Props {
   children?: ReactNode;
   className: string;
   open?: boolean;
   onClose?: () => void;
   incidenceLog?: IncidenceLog | null;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const formatDateInput = (iso?: string) =>
   iso ? format(parseISO(iso), 'yyyy-MM-dd') : '';

const AddIncidenceLog: React.FC<Props> = ({
   className,
   children,
   open,
   onClose,
   incidenceLog,
}) => {
   const dispatch = useDispatch();
   const { IsCreatingIncidenceLog } = useSelector(
      (s: RootState) => s.incidenceLog,
   );
   const { allDepartmentsList } = useSelector((s: RootState) => s.department);
   const { allMeetingLocationsList } = useSelector(
      (s: RootState) => s.meetingLocation,
   );

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [canSubmit, setCanSubmit] = useState(false);
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   const [incidenceDate, setIncidenceDate] = useState<string>(
      incidenceLog?.incidenceDate ? formatDateInput(incidenceLog.incidenceDate) : '',
   );
   const [departmentId, setDepartmentId] = useState<string>(
      incidenceLog?.department?.id ? String(incidenceLog.department.id) : '',
   );
   const [locationId, setLocationId] = useState<string>(
      incidenceLog?.location?.id ? String(incidenceLog.location.id) : '',
   );
   const [incidents, setIncidents] = useState<string[]>(
      incidenceLog?.incidents?.length ? [...incidenceLog.incidents] : [''],
   );
   const [conclusions, setConclusions] = useState<string[]>(
      incidenceLog?.conclusions?.length ? [...incidenceLog.conclusions] : [''],
   );
   const [actionsTaken, setActionsTaken] = useState<string[]>(
      incidenceLog?.actionsTaken?.length ? [...incidenceLog.actionsTaken] : [''],
   );
   const [reportedByUserId, setReportedByUserId] = useState<string>(
      incidenceLog?.reportedByUserId ? String(incidenceLog.reportedByUserId) : '',
   );
   const [facilityMembers, setFacilityMembers] = useState<FacilityMember[]>([]);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (!incidenceLog) {
         setIncidenceDate('');
         setDepartmentId('');
         setLocationId('');
         setIncidents(['']);
         setConclusions(['']);
         setActionsTaken(['']);
         setReportedByUserId('');
         formRef.current?.reset();
      }
      if (onClose) onClose();
   }, [onClose, incidenceLog]);

   useEffect(() => {
      dispatch(departmentActions.getAllDepartments({ limit: 1000 }) as unknown as UnknownAction);
      dispatch(meetingLocationActions.getMeetingLocations() as unknown as UnknownAction);
   }, [dispatch]);

   /**
    * Load the "Reported By" pool — all MEMBER-role users on the app plus the
    * Facility HOD (resolved by Facility department hodEmail). Any Facility
    * member should be able to file an incidence report, so we don't filter
    * strictly by departmentId here.
    */
   useEffect(() => {
      if (!isModalOpen && !open) return;
      const token = Cookies.get('authToken');
      if (!token) return;
      const facility = (allDepartmentsList ?? []).find(
         (d) => d.name?.toLowerCase() === FACILITY_DEPARTMENT_NAME.toLowerCase(),
      );
      const facilityHodEmail = facility?.hodEmail ?? null;
      let cancelled = false;

      const headers = { Authorization: `Bearer ${token}` };
      const requests: Promise<{ items: FacilityMember[] }>[] = [
         axios
            .get(
               `${userConstants.USER_URI}?roleId=${RoleId.MEMBER}&limit=1000`,
               { headers },
            )
            .then((r) => ({
               items:
                  (r?.data?.data?.items ?? r?.data?.data ?? []) as FacilityMember[],
            }))
            .catch(() => ({ items: [] })),
      ];
      if (facilityHodEmail) {
         requests.push(
            axios
               .get(
                  `${userConstants.USER_URI}/details/${encodeURIComponent(
                     facilityHodEmail,
                  )}`,
                  { headers },
               )
               .then((r) => {
                  const hod = r?.data?.data as FacilityMember | undefined;
                  return { items: hod ? [hod] : [] };
               })
               .catch(() => ({ items: [] })),
         );
      }

      (async () => {
         const results = await Promise.all(requests);
         if (cancelled) return;
         // Merge + dedupe by id; surface the Facility HOD first.
         const seen = new Set<number>();
         const merged: FacilityMember[] = [];
         results
            .flatMap((r) => r.items)
            .reverse()
            .forEach((m) => {
               if (!m?.id || seen.has(m.id)) return;
               seen.add(m.id);
               merged.push(m);
            });
         setFacilityMembers(merged);
      })();

      return () => {
         cancelled = true;
      };
   }, [allDepartmentsList, isModalOpen, open]);

   const reportedByOptions = useMemo(
      () =>
         (facilityMembers ?? []).map((m) => ({
            value: String(m.id),
            label: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email || `User #${m.id}`,
         })),
      [facilityMembers],
   );

   const reportedByNameFromId = useMemo(() => {
      const found = (facilityMembers ?? []).find(
         (m) => String(m.id) === reportedByUserId,
      );
      return found ? `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim() : '';
   }, [facilityMembers, reportedByUserId]);

   useEffect(() => {
      const l1 = AppEmitter.addListener(incidenceLogConstants.CREATE_INCIDENCE_LOG_SUCCESS, () => closeModal());
      const l2 = AppEmitter.addListener(incidenceLogConstants.UPDATE_INCIDENCE_LOG_SUCCESS, () => closeModal());
      return () => {
         l1.remove();
         l2.remove();
      };
   }, [closeModal]);

   const departmentOptions = (allDepartmentsList ?? []).map((d) => ({
      value: String(d.id),
      label: d.name,
   }));
   const locationOptions = (allMeetingLocationsList ?? []).map((l) => ({
      value: String(l.id),
      label: l.name,
   }));

   const handleSubmit = () => {
      const reportedByName = incidenceLog
         ? incidenceLog.reportedBy
         : reportedByNameFromId;
      const payload: IncidenceLogForm = {
         id: incidenceLog?.id,
         incidenceDate: new Date(incidenceDate).toISOString(),
         locationId: Number(locationId),
         departmentId: Number(departmentId),
         incidents: incidents.map((s) => s.trim()).filter(Boolean),
         conclusions: conclusions.map((s) => s.trim()).filter(Boolean),
         actionsTaken: actionsTaken.map((s) => s.trim()).filter(Boolean),
         reportedBy: reportedByName,
         reportedByUserId: incidenceLog
            ? (incidenceLog.reportedByUserId ?? undefined)
            : reportedByUserId
               ? Number(reportedByUserId)
               : undefined,
      };
      if (incidenceLog?.id) {
         dispatch(incidenceLogActions.updateIncidenceLog(payload) as unknown as UnknownAction);
      } else {
         dispatch(incidenceLogActions.createIncidenceLog(payload) as unknown as UnknownAction);
      }
   };

   const isOpen = open || isModalOpen;

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={isOpen}
            onClose={closeModal}
            title={incidenceLog ? 'Update Incidence Log' : 'New Incidence Log'}
            subtitle="Record an incident, its conclusions and the actions taken"
            width="sm:w-[54rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-1.5"
            >
               {/* Top row — Date, Location, Department */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                  <DateInput
                     name="incidenceDate"
                     label="Date"
                     placeholder="Select date"
                     value={incidenceDate}
                     onValueChange={(val: string) => setIncidenceDate(val)}
                     required
                     mode="date"
                     maxDate={todayIso()}
                  />
                  <SelectInput
                     name="locationId"
                     label="Location"
                     placeholder="Select location"
                     options={locationOptions}
                     value={locationId}
                     onValueChange={(v) => setLocationId(v)}
                     required
                  />
                  <SelectInput
                     name="departmentId"
                     label="Focus Department"
                     placeholder="Select department"
                     options={departmentOptions}
                     value={departmentId}
                     onValueChange={(v) => setDepartmentId(v)}
                     required
                  />
               </div>

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               <MultiEntryList
                  label="Incident Points"
                  items={incidents}
                  onChange={setIncidents}
                  addLabel="+ Add incident point"
                  placeholder="Describe what happened"
               />

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               <MultiEntryList
                  label="Conclusions"
                  items={conclusions}
                  onChange={setConclusions}
                  addLabel="+ Add conclusion"
                  placeholder="What was determined?"
               />

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               <MultiEntryList
                  label="Actions Taken"
                  items={actionsTaken}
                  onChange={setActionsTaken}
                  addLabel="+ Add action taken"
                  placeholder="What was done about it?"
               />

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               {incidenceLog ? (
                  <TextInput
                     type="text"
                     name="reportedBy"
                     label="Reported By"
                     placeholder="Reported by"
                     value={incidenceLog.reportedBy ?? ''}
                     disabled
                  />
               ) : (
                  <SelectInput
                     name="reportedByUserId"
                     label="Reported By"
                     placeholder="Select the member filing the report"
                     options={reportedByOptions}
                     value={reportedByUserId}
                     onValueChange={(v) => setReportedByUserId(v)}
                     required
                  />
               )}

               {/* Footer */}
               <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={
                        !canSubmit ||
                        !departmentId ||
                        !locationId ||
                        !incidenceDate ||
                        (!incidenceLog && !reportedByUserId) ||
                        incidents.filter((s) => s.trim()).length === 0 ||
                        conclusions.filter((s) => s.trim()).length === 0 ||
                        actionsTaken.filter((s) => s.trim()).length === 0
                     }
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingIncidenceLog ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : incidenceLog ? (
                        'Update Report'
                     ) : (
                        'Create Report'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

/* ── Multi-entry list input (Incidents / Conclusions / Actions) ── */
const MultiEntryList: React.FC<{
   label: string;
   items: string[];
   onChange: (next: string[]) => void;
   addLabel: string;
   placeholder: string;
}> = ({ label, items, onChange, addLabel, placeholder }) => {
   const update = (idx: number, val: string) => {
      const next = [...items];
      next[idx] = val;
      onChange(next);
   };
   const add = () => onChange([...items, '']);
   const remove = (idx: number) => {
      if (items.length === 1) {
         onChange(['']);
         return;
      }
      onChange(items.filter((_, i) => i !== idx));
   };

   return (
      <div>
         <p
            className="text-[0.55rem] uppercase font-semibold tracking-wider mb-2"
            style={{ color: 'var(--text-hint)' }}
         >
            {label}
         </p>
         <div className="space-y-2">
            {items.map((val, i) => (
               <div key={i} className="flex items-start gap-2">
                  <span
                     className="text-xs tabular-nums mt-2.5 w-5 text-right shrink-0"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     {i + 1}.
                  </span>
                  <textarea
                     value={val}
                     onChange={(e) => update(i, e.target.value)}
                     placeholder={placeholder}
                     rows={2}
                     className="flex-1 px-3 py-2 rounded-lg text-sm resize-none"
                     style={{
                        background: 'var(--surface-medium)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--text-primary)',
                     }}
                  />
                  <button
                     type="button"
                     onClick={() => remove(i)}
                     className="mt-2 text-xs shrink-0 cursor-pointer"
                     style={{ color: 'var(--text-hint)' }}
                     aria-label={`Remove ${label} entry ${i + 1}`}
                  >
                     ×
                  </button>
               </div>
            ))}
         </div>
         <button
            type="button"
            onClick={add}
            className="mt-2 text-xs font-semibold cursor-pointer"
            style={{ color: 'var(--color-secondary)' }}
         >
            {addLabel}
         </button>
      </div>
   );
};

export default AddIncidenceLog;
