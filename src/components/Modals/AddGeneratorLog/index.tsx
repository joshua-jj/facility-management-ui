import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Formsy from 'formsy-react';
import DateInput from '@/components/Inputs/DateInput';
import SelectInput from '@/components/Inputs/SelectInput';
import TextArea from '@/components/Inputs/TextArea';
import TextInput from '@/components/Inputs/TextInput';
import HourMeterInput from '@/components/Inputs/HourMeterInput';
import FuelLevelInput from '@/components/Inputs/FuelLevelInput';
import ModalWrapper from '../ModalWrapper';
import { GeneratorForm, GeneratorLog, Item } from '@/types';
import { generatorActions, itemActions, meetingActions, meetingLocationActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { generatorConstants } from '@/constants';
import { format, parseISO } from 'date-fns';
import { Meeting } from '@/types/meeting';

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

   // controlled IDs for the three dropdowns
   const [meetingId, setMeetingId] = useState<string>('');
   const [locationId, setLocationId] = useState<string>('');
   const [selectedGeneratorId, setSelectedGeneratorId] = useState<string>('');

   const openModal = () => setIsModalOpen(true);
   const closeModal = useCallback(() => {
      setIsModalOpen(false);
      if (onClose) onClose();
   }, [onClose]);

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
      } as GeneratorForm;

      if (generatorLog?.id) {
         dispatch(generatorActions.updateGeneratorLog(payload) as unknown as UnknownAction);
      } else {
         dispatch(generatorActions.createGeneratorLog(payload) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(generatorConstants.CREATE_GENERATOR_LOG_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) setIsModalOpen(false);
      });
      const listener2 = AppEmitter.addListener(generatorConstants.UPDATE_GENERATOR_LOG_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) closeModal();
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
                  <DateInput name="onTime" label="On Time" placeholder="Select" value={formatDateTimeLocal(generatorLog?.onTime)} required mode="datetime" />
                  <DateInput name="offTime" label="Off Time" placeholder="Select" value={formatDateTimeLocal(generatorLog?.offTime)} mode="datetime" />
               </div>

               {/* Engine & Fuel row */}
               <p className="text-[0.55rem] uppercase font-semibold tracking-wider mb-0 mt-1" style={{ color: 'var(--text-hint)' }}>Engine &amp; Fuel</p>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3">
                  <HourMeterInput name="engineStartHours" label="Eng. Start" placeholder="0000.0" value={generatorLog?.engineStartHours || ''} required />
                  <HourMeterInput name="engineOffHours" label="Eng. Off" placeholder="0000.0" value={generatorLog?.engineOffHours || ''} />
                  <FuelLevelInput name="dieselLevelOn" label="Diesel On" placeholder="0" value={(generatorLog?.dieselLevelOn ?? '').toString()} required />
                  <FuelLevelInput name="dieselLevelOff" label="Diesel Off" placeholder="0" value={(generatorLog?.dieselLevelOff ?? '').toString()} />
               </div>

               <div className="my-2" style={{ borderTop: '1px solid var(--border-default)' }} />

               {/* Bottom row — Service + Remark side by side */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                  <DateInput name="lastServiceHour" label="Last Service" placeholder="Select date" value={formatDateTimeLocal(generatorLog?.lastServiceHour)} mode="datetime" />
                  <DateInput name="nextServiceHour" label="Next Service" placeholder="Select date" value={formatDateTimeLocal(generatorLog?.nextServiceHour)} mode="datetime" />
                  <TextArea type="text" name="remark" label="Remark" placeholder="Notes" value={generatorLog?.remark || ''} required rows={2} />
               </div>

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
                     disabled={!canSubmit}
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
