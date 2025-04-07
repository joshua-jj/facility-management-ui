// components/RequestForm.tsx
'use client';

import React, { useState } from 'react';
import ItemDetails from './ItemDetails';
import { CaretIcon } from '../Icons';
import RequestDetails from './RequestDetails';
import MoreInformation from './MoreInformation';

const steps = ['Item(s) Details', 'Request Details', 'More Information'];

const RequestForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [items, setItems] = useState([{ id: 1, name: '', quantity: 10 }]);

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
    setItems([...items, { id: items.length + 1, name: '', quantity: 10 }]);
  };

  return (
    <div className="w-md mx-auto p-6 bg-white rounded-md shadow hover:shadow-md">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Request Form</h1>

      {/* Stepper Navigation */}
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
              <span className="mx-[0.6rem] text-[.8rem] font-semibold text-[#848A95]"><CaretIcon /></span>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <ItemDetails items={items} setItems={setItems} addItem={addItem} />
      )}
      {currentStep === 1 && <div><RequestDetails /></div>}
      {currentStep === 2 && <div><MoreInformation /></div>}

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-4 items-center mt-6">
        <button
          onClick={handleBack}
          className={`px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 cursor-pointer ${currentStep === 0 ? 'hidden' : ''}`}
          disabled={currentStep === 0}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RequestForm;