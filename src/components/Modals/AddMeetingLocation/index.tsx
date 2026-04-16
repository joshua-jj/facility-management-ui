import React, { useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import ModalWrapper from '../ModalWrapper';
import { MeetingLocation, MeetingLocationForm } from '@/types/meetingLocation';
import { meetingLocationActions } from '@/actions/meetingLocation.action';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { meetingLocationConstants } from '@/constants/meetingLocation.constant';
import { AppEmitter } from '@/controllers/EventEmitter';

interface AddMeetingLocationProps {
   open: boolean;
   onClose: () => void;
   initialData?: MeetingLocation | null;
   onSaved?: () => void;
}

const AddMeetingLocation: React.FC<AddMeetingLocationProps> = ({ open, onClose, initialData, onSaved }) => {
   const dispatch = useDispatch();
   const { IsCreatingMeetingLocation, IsUpdatingMeetingLocation } = useSelector(
      (state: RootState) => state.meetingLocation,
   );
   const [canSubmit, setCanSubmit] = useState(false);
   const isEdit = !!initialData;
   const isBusy = isEdit ? IsUpdatingMeetingLocation : IsCreatingMeetingLocation;

   const handleSubmit = (data: MeetingLocationForm) => {
      if (isEdit && initialData) {
         dispatch(
            meetingLocationActions.updateMeetingLocation({ id: initialData.id, ...data }) as unknown as UnknownAction,
         );
      } else {
         dispatch(meetingLocationActions.createMeetingLocation(data) as unknown as UnknownAction);
      }
   };

   useEffect(() => {
      const successEvent = isEdit
         ? meetingLocationConstants.UPDATE_MEETING_LOCATION_SUCCESS
         : meetingLocationConstants.CREATE_MEETING_LOCATION_SUCCESS;

      const listener = AppEmitter.addListener(successEvent, () => {
         onClose();
         if (onSaved) onSaved();
      });
      return () => listener.remove();
   }, [isEdit, onClose, onSaved]);

   return (
      <ModalWrapper
         open={open}
         onClose={onClose}
         title={isEdit ? 'Edit Meeting Location' : 'Create Meeting Location'}
         subtitle={isEdit ? 'Update the meeting location details' : 'Add a new meeting location'}
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
               label="Location Name"
               placeholder="Enter location name"
               value={initialData?.name ?? ''}
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
                     'Create Location'
                  )}
               </button>
            </div>
         </Formsy>
      </ModalWrapper>
   );
};

export default AddMeetingLocation;
