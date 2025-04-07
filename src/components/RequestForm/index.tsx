// components/RequestForm.tsx
'use client';

import React, { useState } from 'react';
import ItemDetails from './ItemDetails';

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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Request Form</h1>

      {/* Stepper Navigation */}
      <div className="flex items-center mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <span
              className={`text-sm ${
                index === currentStep ? 'text-yellow-500 font-semibold' : 'text-gray-500'
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="mx-2 text-gray-500">&gt;</span>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <ItemDetails items={items} setItems={setItems} addItem={addItem} />
      )}
      {currentStep === 1 && <div>Request Details (Placeholder)</div>}
      {currentStep === 2 && <div>More Information (Placeholder)</div>}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          disabled={currentStep === 0}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RequestForm;