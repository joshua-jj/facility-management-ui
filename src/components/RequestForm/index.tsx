import React, { FC, useEffect, useState } from 'react';
import ItemDetails from './ItemDetails';

import RequestDetails from './RequestDetails';
import MoreInformation from './MoreInformation';
import { useDispatch, useSelector } from 'react-redux';
import { appActions, departmentActions, requestActions } from '@/actions';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import SuccessModal from '../Modals/SuccessModal';
import { requestConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { Department, Item } from '@/types';

const steps = ['Item(s) Details', 'Requester Details', 'More Information'];

interface FormData {
  items: Item[];
  requestDetails: {
    ministryName: string;
    requesterName: string;
    email: string;
    contactNumber: string;
  };
  moreInformation: {
    location: string;
    returnDate: string;
    dateOfCollection: string;
    description: string;
  };
}

interface RequestFormProps {
  route: string;
}

const RequestForm: FC<RequestFormProps> = ({ route }) => {
  const isWorkerRoute = route.includes('egfm-worker');

  const dispatch = useDispatch();
  const { IsCreatingRequest } = useSelector((s: RootState) => s.request);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isFormValid, setIsFormValid] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    items: [
      {
        id: 1,
        name: '',
        availableQuantity: 10,
        condition: '',
        fragile: false,
        storeId: 0,
        storeName: '',
        requestedQuantity: 0,
      },
    ],
    requestDetails: {
      ministryName: '',
      requesterName: '',
      email: '',
      contactNumber: '',
    },
    moreInformation: {
      location: '',
      returnDate: '',
      dateOfCollection: '',
      description: '',
    },
  });

  useEffect(() => {
    dispatch(departmentActions.getUnpaginatedDepartments() as unknown as UnknownAction);
  }, [dispatch]);

  useEffect(() => {
    const listener = AppEmitter.addListener(
      requestConstants.CREATE_REQUEST_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;

        if (customEvent) {
          setShowSuccessModal(true);
        }
      }
    );

    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setDepartment(null);
        setFormData({
          items: [
            {
              id: 1,
              name: '',
              availableQuantity: 10,
              condition: '',
              fragile: false,
              storeId: 0,
              storeName: '',
              requestedQuantity: 0,
            },
          ],
          requestDetails: {
            ministryName: '',
            requesterName: '',
            email: '',
            contactNumber: '',
          },
          moreInformation: {
            location: '',
            returnDate: '',
            dateOfCollection: '',
            description: '',
          },
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const canProceedStep = () => {
    if (currentStep === 0) {
      // Validate items step
      return formData.items.every(
        (item) =>
          item.name && item.requestedQuantity && item.requestedQuantity > 0
      );
    }
    if (currentStep === 1) {
      // Validate requester details step
      const { ministryName, requesterName, email, contactNumber } =
        formData.requestDetails;
      // If isWorkerRoute, ministryName may not be required
      return (
        (isWorkerRoute || ministryName) &&
        requesterName &&
        email &&
        contactNumber
      );
    }
    if (currentStep === 2) {
      // Validate more information step
      const { location, returnDate } = formData.moreInformation;
      return location && returnDate;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceedStep()) {
      dispatch(appActions.setSnackBar({ type: 'warning', message: 'Please fill all required fields before continuing.', variant: 'warning' }) as unknown as UnknownAction);
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
      items: [
        ...prev.items,
        {
          id: prev.items.length + 1,
          name: '',
          availableQuantity: 10,
          condition: '',
          fragile: false,
          storeId: 0,
          storeName: '',
          requestedQuantity: 0,
        },
      ],
    }));
  };

  const handleSubmit = async () => {
    const requestData = {
      requesterName: formData.requestDetails.requesterName,
      requesterEmail: formData.requestDetails.email,
      requesterPhone: formData.requestDetails.contactNumber,
      isMinistry: isWorkerRoute ? true : false,
      ministryName: formData.requestDetails.ministryName,
      requesterDepartmentId: department?.id,
      locationOfUse: formData.moreInformation.location,
      // durationOfUse: '1 week',
      // durationOfUse: formData.moreInformation.returnDate,
      dateOfReturn: formData.moreInformation.returnDate,
      dateOfCollection: formData.moreInformation.dateOfCollection,
      descriptionOfRequest: formData.moreInformation.description,
      items: formData.items.map((item) => ({
        storeId: item.storeId,
        itemId: item.id,
        quantityLeased: item.requestedQuantity || 0,
        conditionBeforeLease: item.condition,
      })),
    };
    // console.log('requestData:', requestData);
    // console.log('formData.items:', formData.items);

    dispatch(
      requestActions.createRequest(requestData) as unknown as UnknownAction
    );
  };

  const canSubmit = () => {
    const { items, requestDetails, moreInformation } = formData;
    return (
      items.every(
        (item) =>
          item.name && item.requestedQuantity && item.requestedQuantity > 0
      ) &&
      requestDetails.ministryName &&
      requestDetails.requesterName &&
      requestDetails.email &&
      requestDetails.contactNumber &&
      moreInformation.location &&
      moreInformation.dateOfCollection &&
      moreInformation.returnDate
    );
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
        <div className="px-6 py-5 animate-fade-up">
          {/* Step subtitle */}
          <p className="text-[0.6rem] uppercase font-semibold tracking-wider mb-3" style={{ color: 'var(--text-hint)' }}>
            Step {currentStep + 1} of {steps.length} — {steps[currentStep]}
          </p>

          {currentStep === 0 && (
            <ItemDetails
              items={formData.items}
              department={department}
              setDepartment={setDepartment}
              setItems={(items) => setFormData((prev) => ({ ...prev, items }))}
              addItem={addItem}
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
              disabled={!canProceedStep() || !isFormValid}
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
      <SuccessModal
        setShowSuccessModal={setShowSuccessModal}
        showSuccessModal={showSuccessModal}
        subMessage="A ticket has been sent to your mail."
        message="Request submitted successfully"
      />
    </>
  );
};

export default RequestForm;
