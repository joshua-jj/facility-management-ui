import { addValidationRule } from 'formsy-react';

addValidationRule('isValidPhone', (values, value) => {
  const phoneRegex = /^(0\d{10}|234\d{10}|\+234\d{10})$/;
  return phoneRegex.test(String(value));
});
