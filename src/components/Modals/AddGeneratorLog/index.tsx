import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Formsy from 'formsy-react';
import DateInput from '@/components/Inputs/DateInput';
import SelectInput from '@/components/Inputs/SelectInput';
import TextArea from '@/components/Inputs/TextArea';
import TextInput from '@/components/Inputs/TextInput';
import HourMeterInput from '@/components/Inputs/HourMeterInput';
import FuelLevelInput from '@/components/Inputs/FuelLevelInput';
import ModalWrapper from '../ModalWrapper';
import { DieselUnit, GeneratorForm, GeneratorLog, Item } from '@/types';
import { generatorActions, itemActions, meetingActions, meetingLocationActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { generatorConstants } from '@/constants';
import { format, parseISO } from 'date-fns';
import { Meeting } from '@/types/meeting';

const SERVICE_THRESHOLD_HOURS = 48;

interface AddItemModalProps {
   children?: ReactNode;
   className: string;
   generatorLog?: GeneratorLog | null;
   open?: boolean;
   onClose?: () => void;
}

const formatDateTimeLocal = (iso?: string) => (iso ? format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") : '');

const AddGeneratorLog: React.FC<AddItemModalProps> = ({
   className,
   children,
   generatorLog,
   open,
   onClose,
}) => {
   const dispatch = useDispatch();
   const { IsCreatingGeneratorLog } = useSelector((s: RootState) => s.generator);
   const { departmentItemsList } = useSelector((s: RootState) => s.item);
   const { allMeetingsList } = useSelector((s: RootState) => s.meeting);
   const { allMeetingLocationsList } = useSelector((s: RootState) => s.meetingLocation);

   const [canSubmit, setCanSubmit] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const formRef = useRef<InstanceType<typeof Formsy> | null>(null);

   // controlled IDs for the three dropdowns
   const [meetingId, setMeetingId] = useState<string>('');
   const [locationId, setLocationId] = useState<string>('');
   const [selectedGeneratorId, setSelectedGeneratorId] = useState<string>('');

   // Paired fields — tracked in local state so we can cross-validate.
   const [onTime, setOnTime] = useState<string>(
      generatorLog?.onTime ? formatDateTimeLocal(generatorLog.onTime) : '',
   );
   const [offTime, setOffTime] = useState<string>(
      generatorLog?.offTime ? formatDateTimeLocal(generatorLog.offTime) : '',
   );
   const [engineStartHours, setEngineStartHours] = useState<string>(
      generatorLog?.engineStartHours ?? '',
   );
   const [engineOffHours, setEngineOffHours] = useState<string>(
      generatorLog?.engineOffHours ?? '',
   );
   const [dieselLevelOn, setDieselLevelOn] = useState<string>(
      (generatorLog?.dieselLevelOn ?? '').toString(),
   );
   const [dieselLevelOff, setDieselLevelOff] = useState<string>(
      (generatorLog?.dieselLevelOff ?? '').toString(),
   );
   const [dieselUnit, setDieselUnit] = useState<DieselUnit>(
      (generatorLog?.dieselUnit as DieselUnit) ?? 'litres',
   );

   // Auto-filled service schedule for the selected generator (read-only).
   const [scheduleLastHour, setScheduleLastHour] = useState<number | null>(null);
   const [scheduleNextHour, setScheduleNextHour] = useState<number | null>(null);

   /** Fetch the service schedule when a generator is selected (create mode)
    *  or on mount in edit mode. Auto-populates the read-only last/next fields. */
   useEffect(() => {
      const gid = generatorLog?.generatorTypeId
         ? Number(generatorLog.generatorTypeId)
         : selectedGeneratorId
           ? Number(selectedGeneratorId)
           : null;
      if (!gid) {
         setScheduleLastHour(null);
         setScheduleNextHour(null);
         return;
      }
      const token = Cookies.get('authToken');
      if (!token) return;
      let cancelled = false;
      axios
         .get(`${generatorConstants.GENERATOR_URI}/schedule/${gid}`, {
            headers: { Authorization: `Bearer ${token}` },
         })
         .then((resp) => {
            if (cancelled) return;
            const data = resp?.data?.data;
            setScheduleLastHour(
               data?.lastServiceHour != null
                  ? Number(data.lastServiceHour)
                  : null,
            );
            setScheduleNextHour(
               data?.nextServiceHour != null
                  ? Number(data.nextServiceHour)
                  : null,
            );
         })
         .catch(() => {
            if (!cancelled) {
               setScheduleLastHour(null);
               setScheduleNextHour(null);
            }
         });
      return () => {
         cancelled = true;
      };
   }, [selectedGeneratorId, generatorLog?.generatorTypeId]);

   /** Remaining engine hours until the scheduled service window. Negative = overdue. */
   const remainingHoursUntilService = useMemo((): number | null => {
      if (scheduleNextHour == null) return null;
      const eOff = engineOffHours ? Number(engineOffHours) : null;
      if (eOff == null || !Number.isFinite(eOff)) return null;
      return scheduleNextHour - eOff;
   }, [scheduleNextHour, engineOffHours]);

   /** True if this generator is within the service window — form is disabled. */
   const isServiceOverdue =
      remainingHoursUntilService != null &&
      remainingHoursUntilService <= SERVICE_THRESHOLD_HOURS;

   /** Cross-field validation — each entry is null when OK, string when bad */
   const validationErrors = useMemo(() => {
      const errs: Record<string, string | null> = {
         offTime: null,
         engineOffHours: null,
         dieselLevelOn: null,
         dieselLevelOff: null,
      };
      if (onTime && offTime) {
         const on = new Date(onTime).getTime();
         const off = new Date(offTime).getTime();
         if (Number.isFinite(on) && Number.isFinite(off) && off < on) {
            errs.offTime = 'Off Time must be on or after On Time.';
         }
      }
      const eStart = engineStartHours ? Number(engineStartHours) : null;
      const eOff = engineOffHours ? Number(engineOffHours) : null;
      if (eStart != null && eOff != null && eOff < eStart) {
         errs.engineOffHours = 'Engine Off must be ≥ Engine Start.';
      }
      const dOn = dieselLevelOn ? Number(dieselLevelOn) : null;
      const dOff = dieselLevelOff ? Number(dieselLevelOff) : null;
      if (dOn != null && dOff != null && dOff > dOn) {
         errs.dieselLevelOff = 'Diesel Off must be ≤ Diesel On (fuel decreases).';
      }
      if (dieselUnit === 'percentage') {
         if (dOn != null && (dOn < 0 || dOn > 100))
            errs.dieselLevelOn = 'Must be between 0 and 100.';
         if (dOff != null && (dOff < 0 || dOff > 100))
            errs.dieselLevelOff = errs.dieselLevelOff ?? 'Must be between 0 and 100.';
      }
      return errs;
   }, [onTime, offTime, engineStartHours, engineOffHours, dieselLevelOn, dieselLevelOff, dieselUnit]);

   const hasValidationErrors = Object.values(validationErrors).some((v) => v);

   const resetForm = useCallback(() => {
      setMeetingId('');
      setLocationId('');
      setSelectedGeneratorId('');
      setOnTime('');
      setOffTime('');
      setEngineStartHours('');
      setEngineOffHours('');
      setDieselLevelOn('');
      setDieselLevelOff('');
      setDieselUnit('litres');
      setScheduleLastHour(null);
      setScheduleNextHour(null);
      formRef.current?.reset();
   }, []);

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      resetForm();
      if (onClose) onClose();
   }, [onClose, resetForm]);

   // Pre-populate in edit mode
   useEffect(() => {
      if (generatorLog) {
         setMeetingId(generatorLog.meeting ? String(generatorLog.meeting.id) : '');
         setLocationId(generatorLog.location ? String(generatorLog.location.id) : '');
      }
   }, [generatorLog]);

   useEffect(() => {
      dispatch(itemActions.getDepartmentItems({ departmentId: 1 }) as unknown as UnknownAction);
      dispatch(meetingActions.getMeetings() as unknown as UnknownAction);
      dispatch(meetingLocationActions.getMeetingLocations() as unknown as UnknownAction);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   // When meeting changes, auto-fill location from meeting.location
   const handleMeetingChange = (val: string) => {
      setMeetingId(val);
      const found = (allMeetingsList ?? []).find((m: Meeting) => String(m.id) === val);
      if (found?.location?.id) {
         setLocationId(String(found.location.id));
      }
   };

   const generatorOptions = useMemo(
      () =>
         (departmentItemsList ?? [])
            .filter((item: Item) => item.name.toLowerCase().includes('generator'))
            .map((item: Item) => ({ value: String(item.id), label: item.name })),
      [departmentItemsList],
   );

   const meetingOptions = useMemo(
      () =>
         (allMeetingsList ?? []).map((m: Meeting) => ({
            value: String(m.id),
            label: m.name,
         })),
      [allMeetingsList],
   );

   const locationOptions = useMemo(
      () =>
         (allMeetingLocationsList ?? []).map((l) => ({
            value: String(l.id),
            label: l.name,
         })),
      [allMeetingLocationsList],
   );

   const handleSubmit = (data: Omit<GeneratorForm, 'meetingId' | 'locationId' | 'generatorTypeId'>) => {
      const generatorTypeId = generatorLog
         ? departmentItemsList?.find((item: Item) => item.name === generatorLog.generatorType)?.id
         : Number(selectedGeneratorId);

      const base: Partial<GeneratorForm> = {
         generatorTypeId,
         meetingId: Number(meetingId),
         locationId: Number(locationId),
      };

      const cleaned: Partial<GeneratorForm> = Object.entries(data).reduce(
         (acc, [key, value]) => {
            if (value === '' || value === null || value === undefined) return acc;
            const typedKey = key as keyof GeneratorForm;

            if (['engineStartHours', 'engineOffHours', 'dieselLevelOn', 'dieselLevelOff', 'remark'].includes(typedKey)) {
               acc[typedKey] = value as never;
            } else if (typedKey === 'generatorTypeId') {
               const num = Number(value);
               if (!Number.isNaN(num)) acc[typedKey] = num as GeneratorForm[typeof typedKey];
            } else if (['onTime', 'offTime', 'lastServiceHour', 'nextServiceHour'].includes(typedKey)) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               (acc as any)[typedKey] = new Date(String(value)).toISOString();
            }
            return acc;
         },
         {} as Partial<GeneratorForm>,
      );

      const payload: GeneratorForm = {
         ...base,
         ...cleaned,
         id: generatorLog?.id ?? undefined,
         generatorTypeId: generatorTypeId as number,
         meetingId: Number(meetingId),
         locationId: Number(locationId),
         dieselUnit,
      } as GeneratorForm;

      if (generatorLog?.id) {
         dispatch(generatorActions.updateGeneratorLog(payload) as unknown as UnknownAction);
      } else {
         dispatch(generatorActions.createGeneratorLog(payload) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(generatorConstants.CREATE_GENERATOR_LOG_SUCCESS, () => {
         closeModal();
      });
      const listener2 = AppEmitter.addListener(generatorConstants.UPDATE_GENERATOR_LOG_SUCCESS, () => {
         closeModal();
      });
      return () => {
         listener.remove();
         listener2.remove();
      };
   }, [closeModal]);

   const isOpen = open || isModalOpen;

   return (
      <>
         <span className={className} onClick={openModal} role="button" tabIndex={0}>
            {children}
         </span>

         <ModalWrapper
            open={isOpen}
            onClose={closeModal}
            title={generatorLog ? 'Update Generator Log' : 'New Generator Log'}
            subtitle="Record generator usage details"
            width="sm:w-[54rem]"
         >
            <Formsy
               ref={formRef}
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-1.5"
            >
               {/* Top row — 3 columns: Meeting, Location, Generator */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                  <SelectInput
                     name="meetingId"
                     label="Meeting Name"
                     placeholder="Select meeting"
                     options={meetingOptions}
                     value={meetingId}
                     onValueChange={handleMeetingChange}
                     required
                  />
                  <SelectInput
                     name="locationId"
                     label="Location"
                     placeholder="Select location"
                     options={locationOptions}
                     value={locationId}
                     onValueChange={(val) => setLocationId(val)}
                     required
                  />
                  {!generatorLog ? (
                     <SelectInput
                        name="generatorTypeId"
                        label="Generator Used"
                        placeholder="Select generator"
                        options={generatorOptions}
                        value={selectedGeneratorId}
                        onValueChange={(val) => setSelectedGeneratorId(val)}
                        required
                     />
                  ) : (
                     <TextInput
                        type="text"
                        name="_generatorType"
                        label="Generator"
                        value={generatorLog.generatorType}
                        disabled
                     />
                  )}
               </div>

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               {/* Timing row — On Time and Off Time side by side */}
               <p className="text-[0.55rem] uppercase font-semibold tracking-wider mb-0" style={{ color: 'var(--text-hint)' }}>Timing</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <div>
                     <DateInput
                        name="onTime"
                        label="On Time"
                        placeholder="Select"
                        value={onTime}
                        onValueChange={(val: string) => setOnTime(val)}
                        required
                        mode="datetime"
                     />
                  </div>
                  <div>
                     <DateInput
                        name="offTime"
                        label="Off Time"
                        placeholder="Select"
                        value={offTime}
                        onValueChange={(val: string) => setOffTime(val)}
                        mode="datetime"
                     />
                     {validationErrors.offTime && (
                        <p className="text-red-500 text-xs -mt-1">{validationErrors.offTime}</p>
                     )}
                  </div>
               </div>

               {/* Engine & Fuel row */}
               <div className="flex items-center justify-between mt-1">
                  <p className="text-[0.55rem] uppercase font-semibold tracking-wider mb-0" style={{ color: 'var(--text-hint)' }}>Engine &amp; Fuel</p>
                  <div className="inline-flex rounded-md overflow-hidden text-[0.6rem] font-semibold" style={{ border: '1px solid var(--border-strong)' }}>
                     <button
                        type="button"
                        onClick={() => setDieselUnit('litres')}
                        className="px-2.5 py-1 transition-colors cursor-pointer"
                        style={{
                           background: dieselUnit === 'litres' ? 'var(--color-secondary)' : 'transparent',
                           color: dieselUnit === 'litres' ? '#fff' : 'var(--text-secondary)',
                        }}
                     >
                        Litres
                     </button>
                     <button
                        type="button"
                        onClick={() => setDieselUnit('percentage')}
                        className="px-2.5 py-1 transition-colors cursor-pointer"
                        style={{
                           background: dieselUnit === 'percentage' ? 'var(--color-secondary)' : 'transparent',
                           color: dieselUnit === 'percentage' ? '#fff' : 'var(--text-secondary)',
                        }}
                     >
                        Percentage
                     </button>
                  </div>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3">
                  <HourMeterInput
                     name="engineStartHours"
                     label="Eng. Start"
                     placeholder="0000.0"
                     value={engineStartHours}
                     onValueChange={(val: string) => setEngineStartHours(val)}
                     required
                  />
                  <div>
                     <HourMeterInput
                        name="engineOffHours"
                        label="Eng. Off"
                        placeholder="0000.0"
                        value={engineOffHours}
                        onValueChange={(val: string) => setEngineOffHours(val)}
                     />
                     {validationErrors.engineOffHours && (
                        <p className="text-red-500 text-xs -mt-1">{validationErrors.engineOffHours}</p>
                     )}
                  </div>
                  <div>
                     <FuelLevelInput
                        name="dieselLevelOn"
                        label={`Diesel On${dieselUnit === 'percentage' ? ' (%)' : ' (L)'}`}
                        placeholder="0"
                        value={dieselLevelOn}
                        onValueChange={(val: string) => setDieselLevelOn(val)}
                        required
                     />
                     {validationErrors.dieselLevelOn && (
                        <p className="text-red-500 text-xs -mt-1">{validationErrors.dieselLevelOn}</p>
                     )}
                  </div>
                  <div>
                     <FuelLevelInput
                        name="dieselLevelOff"
                        label={`Diesel Off${dieselUnit === 'percentage' ? ' (%)' : ' (L)'}`}
                        placeholder="0"
                        value={dieselLevelOff}
                        onValueChange={(val: string) => setDieselLevelOff(val)}
                     />
                     {validationErrors.dieselLevelOff && (
                        <p className="text-red-500 text-xs -mt-1">{validationErrors.dieselLevelOff}</p>
                     )}
                  </div>
               </div>

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               {/* Service schedule — read-only, auto-filled from DB */}
               <p className="text-[0.55rem] uppercase font-semibold tracking-wider mb-0 mt-1" style={{ color: 'var(--text-hint)' }}>Service Schedule</p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                  <div className="my-3">
                     <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Last Service Hour</label>
                     <div
                        className="w-full px-3 py-2.5 rounded-lg text-sm"
                        style={{
                           background: 'var(--surface-medium)',
                           border: '1px solid var(--border-strong)',
                           color: scheduleLastHour != null ? 'var(--text-primary)' : 'var(--text-hint)',
                        }}
                     >
                        {scheduleLastHour != null ? `${scheduleLastHour.toFixed(1)} hrs` : '— auto-filled'}
                     </div>
                  </div>
                  <div className="my-3">
                     <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Next Service Hour</label>
                     <div
                        className="w-full px-3 py-2.5 rounded-lg text-sm"
                        style={{
                           background: 'var(--surface-medium)',
                           border: '1px solid var(--border-strong)',
                           color: scheduleNextHour != null ? 'var(--text-primary)' : 'var(--text-hint)',
                        }}
                     >
                        {scheduleNextHour != null ? `${scheduleNextHour.toFixed(1)} hrs` : '— auto-filled'}
                     </div>
                  </div>
                  <TextArea type="text" name="remark" label="Remark" placeholder="Notes" value={generatorLog?.remark || ''} required rows={2} />
               </div>

               {/* Overdue banner + form disable */}
               {isServiceOverdue && (
                  <div
                     role="alert"
                     className="mt-3 px-4 py-3 rounded-lg border-2 font-semibold text-sm"
                     style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgb(239, 68, 68)',
                        color: 'rgb(239, 68, 68)',
                     }}
                  >
                     This generator is within {SERVICE_THRESHOLD_HOURS} engine hours of its scheduled service.
                     <div className="font-normal text-xs mt-1 opacity-80">
                        No new log can be filled till this generator is serviced. Facility HOD and Super Admins have been notified and will advance the service schedule once serviced.
                     </div>
                  </div>
               )}

               {/* Submit */}
               <div className="flex justify-end pt-3 mt-1" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit || hasValidationErrors || isServiceOverdue}
                     type="submit"
                     className="px-5 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingGeneratorLog ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Saving...
                        </span>
                     ) : generatorLog ? (
                        'Update Log'
                     ) : (
                        'Create Log'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>
      </>
   );
};

export default AddGeneratorLog;
