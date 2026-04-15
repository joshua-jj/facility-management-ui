import React, { useEffect, useMemo, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import SelectInput from '@/components/Inputs/SelectInput';
import ModalWrapper from '../ModalWrapper';
import { Meeting, MeetingForm } from '@/types/meeting';
import { meetingActions } from '@/actions/meeting.action';
import { meetingLocationActions } from '@/actions/meetingLocation.action';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { meetingConstants } from '@/constants/meeting.constant';
import { AppEmitter } from '@/controllers/EventEmitter';

interface AddMeetingProps {
   open: boolean;
   onClose: () => void;
   initialData?: Meeting | null;
   onSaved?: () => void;
}

const AddMeeting: React.FC<AddMeetingProps> = ({ open, onClose, initialData, onSaved }) => {
   const dispatch = useDispatch();
   const { IsCreatingMeeting, IsUpdatingMeeting } = useSelector(
      (state: RootState) => state.meeting,
   );
   const { allMeetingLocationsList } = useSelector(
      (state: RootState) => state.meetingLocation,
   );
   const [canSubmit, setCanSubmit] = useState(false);
   const isEdit = !!initialData;
   const isBusy = isEdit ? IsUpdatingMeeting : IsCreatingMeeting;

   const locationOptions = useMemo(
      () =>
         (allMeetingLocationsList ?? []).map((loc) => ({
            value: String(loc.id),
            label: loc.name,
         })),
      [allMeetingLocationsList],
   );

   const handleSubmit = (data: MeetingForm & { locationId: string }) => {
      const payload = { name: data.name, locationId: Number(data.locationId) };
      if (isEdit && initialData) {
         dispatch(
            meetingActions.updateMeeting({ id: initialData.id, ...payload }) as unknown as UnknownAction,
         );
      } else {
         dispatch(meetingActions.createMeeting(payload) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const successEvent = isEdit
         ? meetingConstants.UPDATE_MEETING_SUCCESS
         : meetingConstants.CREATE_MEETING_SUCCESS;

      const listener = AppEmitter.addListener(successEvent, () => {
         onClose();
         if (onSaved) onSaved();
      });
      return () => listener.remove();
   }, [isEdit, onClose, onSaved]);

   useEffect(() => {
      if (open) {
         dispatch(meetingLocationActions.getMeetingLocations() as unknown as UnknownAction);
      }
   }, [open, dispatch]);

   return (
      <ModalWrapper
         open={open}
         onClose={onClose}
         title={isEdit ? 'Edit Meeting' : 'Create Meeting'}
         subtitle={isEdit ? 'Update the meeting details' : 'Add a new meeting'}
         width="sm:w-[28rem]"
      >
         <Formsy
            onValidSubmit={handleSubmit}
            onValid={() => setCanSubmit(true)}
            onInvalid={() => setCanSubmit(false)}
         >
            <TextInput
               type="text"
               name="name"
               label="Meeting Name"
               placeholder="Enter meeting name"
               value={initialData?.name ?? ''}
               required
            />

            <SelectInput
               name="locationId"
               label="Default Location"
               placeholder="Select a location"
               options={locationOptions}
               value={initialData?.location ? String(initialData.location.id) : ''}
               required
            />

            <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
               <button
                  type="button"
                  onClick={onClose}
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
                  {isBusy ? (
                     <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isEdit ? 'Saving...' : 'Creating...'}
                     </span>
                  ) : isEdit ? (
                     'Save Changes'
                  ) : (
                     'Create Meeting'
                  )}
               </button>
            </div>
         </Formsy>
      </ModalWrapper>
   );
};

export default AddMeeting;
