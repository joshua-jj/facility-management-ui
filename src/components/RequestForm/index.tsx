import React, { useEffect, useState } from 'react';
import ItemDetails from './ItemDetails';
import { CaretIcon } from '../Icons';
import RequestDetails from './RequestDetails';
import MoreInformation from './MoreInformation';
import { useDispatch, useSelector } from 'react-redux';
import { departmentActions, requestActions } from '@/actions';
import { UnknownAction } from 'redux';
// import { Items } from '@/redux/reducers/item.reducer';
// import { Department } from '@/redux/reducers/department.reducer';
import { RootState } from '@/redux/reducers';
import SuccessModal from '../Modals/SuccessModal';
import { requestConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { Department, Item } from '@/types';

const steps = ['Item(s) Details', 'Request Details', 'More Information'];

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
    description: string;
  };
}

const RequestForm: React.FC = () => {
  const dispatch = useDispatch();
  const { IsCreatingRequest } = useSelector((s: RootState) => s.request);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
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
      description: '',
    },
  });

  useEffect(() => {
    dispatch(departmentActions.getAllDepartments() as unknown as UnknownAction);
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

  const handleNext = () => {
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
    // setIsSubmitting(true);
    // console.log('formData:', formData);
    const requestData = {
      requesterName: formData.requestDetails.requesterName,
      requesterEmail: formData.requestDetails.email,
      requesterPhone: formData.requestDetails.contactNumber,
      isMinistry: true,
      ministryName: formData.requestDetails.ministryName,
      requesterDepartmentId: department?.id,
      locationOfUse: formData.moreInformation.location,
      durationOfUse: '1 week',
      dateOfReturn: formData.moreInformation.returnDate,
      descriptionOfRequest: formData.moreInformation.description,
      items: formData.items.map((item) => ({
        storeId: item.storeId,
        itemId: item.id,
        quantityLeased: item.requestedQuantity || 0,
        conditionBeforeLease: item.condition,
      })),
    };
    dispatch(
      requestActions.createRequest(requestData) as unknown as UnknownAction
    );

    // try {
    //   const response = await fetch('/api/submit-request', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(formData),
    //   });

    //   if (!response.ok) {
    //     throw new Error('Failed to submit request');
    //   }

    //   const result = await response.json();
    //   console.log('Submission successful:', result);
    //   // Optionally reset the form or redirect
    //   setFormData({
    //     items: [
    //       {
    //         id: 1,
    //         name: '',
    //         availableQuantity: 10,
    //         condition: '',
    //         fragile: false,
    //         storeId: 0,
    //         storeName: '',
    //         requestedQuantity: 0,
    //       },
    //     ],
    //     requestDetails: {
    //       ministryName: '',
    //       requesterName: '',
    //       email: '',
    //       contactNumber: '',
    //     },
    //     moreInformation: {
    //       location: '',
    //       returnDate: '',
    //       description: '',
    //     },
    //   });
    //   setCurrentStep(0); // Go back to the first step
    // } catch (error) {
    //   console.error('Error submitting request:', error);
    //   alert('Failed to submit request. Please try again.');
    // } finally {
    //   setIsSubmitting(false);
    // }
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
      moreInformation.returnDate
    );
  };

  return (
    <>
      <div className="w-md mx-auto p-6 bg-white rounded-md shadow hover:shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Request Form</h1>
        <div className="flex items-center mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <span
                className={`text-[.75rem] leading-6 tracking-wide font-[600] ${
                  index === currentStep ? 'text-yellow-500' : 'text-[#848A95]'
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <span className="mx-[0.6rem] text-[.8rem] font-semibold text-[#848A95]">
                  <CaretIcon />
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
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

        <div className="flex justify-end gap-4 items-center mt-6">
          <button
            onClick={handleBack}
            className={`px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 cursor-pointer ${
              currentStep === 0 ? 'hidden' : ''
            }`}
            disabled={currentStep === 0}
          >
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || IsCreatingRequest}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              {IsCreatingRequest ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Submit'
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
