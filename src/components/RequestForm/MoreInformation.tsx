import React from 'react';
import TextInput from '../Inputs/TextInput';
import DateInput from '../Inputs/DateInput';
import Formsy from 'formsy-react';
import TextArea from '../Inputs/TextArea';

interface MoreInformationProps {
   data: {
      location: string;
      returnDate: string;
      dateOfCollection: string;
      description: string;
   };
   setData: (data: {
      location: string;
      returnDate: string;
      dateOfCollection: string;
      description: string;
   }) => void;
}

// Today's date in YYYY-MM-DD form. Computed at render time so a long-lived
// tab still sees "today" as today, not the day the page loaded.
const todayIso = () => {
   const d = new Date();
   d.setHours(0, 0, 0, 0);
   return d.toISOString().split('T')[0];
};

const MoreInformation: React.FC<MoreInformationProps> = ({ data, setData }) => {
   const handleChange = (currentValues: {
      location?: string;
      return_date?: string;
      dateOfCollection?: string;
      description?: string;
   }) => {
      // Use ?? so the user can clear a field — the previous `||` fallback
      // silently restored stale state when the user emptied an input.
      setData({
         location: currentValues.location ?? data.location,
         returnDate: currentValues.return_date ?? data.returnDate,
         dateOfCollection: currentValues.dateOfCollection ?? data.dateOfCollection,
         description: currentValues.description ?? data.description,
      });
   };

   const today = todayIso();
   const startOfToday = new Date(today).getTime();

   // Collect each field's violation (if any). Past dates and out-of-order
   // dates are flagged inline so users see *why* the submit button is
   // disabled; the form-root canSubmit/canProceedStep guards block the
   // submission as a backstop.
   const collectionDateError = (() => {
      if (!data.dateOfCollection) return null;
      const c = new Date(data.dateOfCollection).getTime();
      if (!Number.isFinite(c)) return null;
      if (c < startOfToday) return 'Collection Date cannot be in the past.';
      return null;
   })();

   const returnDateError = (() => {
      if (!data.returnDate) return null;
      const r = new Date(data.returnDate).getTime();
      if (!Number.isFinite(r)) return null;
      if (r < startOfToday) return 'Return Date cannot be in the past.';
      if (data.dateOfCollection) {
         const c = new Date(data.dateOfCollection).getTime();
         if (Number.isFinite(c) && r < c) {
            return 'Return Date must be on or after the Collection Date.';
         }
      }
      return null;
   })();

   // Return Date's lower bound is today OR the chosen collection date,
   // whichever is later — prevents picking a return that's earlier than
   // the collection in the calendar UI.
   const returnMinDate = (() => {
      if (!data.dateOfCollection) return today;
      const c = new Date(data.dateOfCollection).getTime();
      if (!Number.isFinite(c) || c < startOfToday) return today;
      return data.dateOfCollection;
   })();

   return (
      <Formsy onChange={handleChange}>
         <TextInput
            type="text"
            name="location"
            label="Location of use"
            placeholder="e.g City gate church"
            value={data.location}
            required
         />
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div>
               <DateInput
                  name="dateOfCollection"
                  label="Collection Date"
                  placeholder="Select collection date"
                  value={data.dateOfCollection}
                  minDate={today}
                  mode="date"
               />
               {collectionDateError && (
                  <p className="text-red-500 text-xs -mt-1">{collectionDateError}</p>
               )}
            </div>
            <div>
               <DateInput
                  name="return_date"
                  label="Return Date"
                  placeholder="Select return date"
                  value={data.returnDate}
                  minDate={returnMinDate}
                  mode="date"
               />
               {returnDateError && (
                  <p className="text-red-500 text-xs -mt-1">{returnDateError}</p>
               )}
            </div>
         </div>
         <TextArea
            type="text"
            name="description"
            label="Description"
            placeholder="Describe what you need the items for"
            rows={4}
            value={data.description}
         />
      </Formsy>
   );
};

export default MoreInformation;
