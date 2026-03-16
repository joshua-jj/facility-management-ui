import React, { useEffect, useState } from 'react';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import TextArea from '@/components/Inputs/TextArea';
import PhoneInput from '@/components/Inputs/PhoneInput';
import ModalWrapper from '../ModalWrapper';
import { ReportForm } from '@/types';
import { reportActions } from '@/actions';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { AppEmitter } from '@/controllers/EventEmitter';
import { reportConstants } from '@/constants';
import SuccessModal from './SuccessModal';

interface ReportProps {
   className?: string;
   children?: React.ReactNode;
}

const Report: React.FC<ReportProps> = ({ className, children }) => {
   const dispatch = useDispatch();
   const { IsCreatingReport } = useSelector((s: RootState) => s.report);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [canSubmit, setCanSubmit] = useState(false);
   const [isSuccessOpen, setIsSuccessOpen] = useState(false);

   const openModal = () => setIsModalOpen(true);
   const closeModal = () => setIsModalOpen(false);

   const handleSubmit = (data: ReportForm) => {
      dispatch(reportActions.sendReport(data) as unknown as UnknownAction);
   };

   useEffect(() => {
      const listener = AppEmitter.addListener(reportConstants.SEND_REPORT_SUCCESS, (evt: Event) => {
         if (evt as CustomEvent) {
            setIsModalOpen(false);
            setIsSuccessOpen(true);
         }
      });
      return () => listener.remove();
   }, []);

   return (
      <>
         <button onClick={openModal} className={className}>
            {children}
         </button>

         <ModalWrapper
            open={isModalOpen}
            onClose={closeModal}
            title="Report an Issue"
            subtitle="Let us know about any problem or complaint"
            width="sm:w-[36rem]"
         >
            <Formsy
               onValidSubmit={handleSubmit}
               onValid={() => setCanSubmit(true)}
               onInvalid={() => setCanSubmit(false)}
               className="[&_.my-3]:my-1.5"
            >
               {/* Row 1 — Name & Email */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <TextInput
                     type="text"
                     name="complainerName"
                     label="Full Name"
                     placeholder="Enter your full name"
                     required
                  />
                  <TextInput
                     type="email"
                     name="complainerEmail"
                     label="Email Address"
                     placeholder="Enter your email"
                     validations="isEmail"
                     validationError="Please enter a valid email"
                     required
                  />
               </div>

               {/* Row 2 — Phone & Subject */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <PhoneInput
                     name="complainerPhone"
                     label="Contact Number"
                     required
                     defaultCountry="NG"
                     outputFormat="local"
                  />
                  <TextInput
                     type="text"
                     name="complaintSubject"
                     label="Subject of Complaint"
                     placeholder="Enter subject"
                     required
                  />
               </div>

               {/* Row 3 — Description */}
               <TextArea
                  type="text"
                  name="complaintDescription"
                  label="Description"
                  placeholder="Describe your issue in detail..."
                  required
                  rows={3}
               />

               {/* Footer */}
               <div className="flex justify-end pt-3 mt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2.5 rounded-lg text-xs font-semibold mr-2 cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Cancel
                  </button>
                  <button
                     disabled={!canSubmit}
                     type="submit"
                     className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                     style={{ background: 'var(--color-secondary)' }}
                  >
                     {IsCreatingReport ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                           Submitting...
                        </span>
                     ) : (
                        'Submit Report'
                     )}
                  </button>
               </div>
            </Formsy>
         </ModalWrapper>

         <SuccessModal
            open={isSuccessOpen}
            onClose={() => setIsSuccessOpen(false)}
            autoCloseDelay={3000}
         />
      </>
   );
};

export default Report;
