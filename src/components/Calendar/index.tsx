'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import { CaretIcon } from '../Icons';
import FullscreenModal from '../Modals';

type CalendarEvent = {
   id: string;
   date: string;
   title: string;
   description: string;
};

dayjs.extend(isBetween);
dayjs.extend(isToday);

interface CalendarProps {
   events?: CalendarEvent[];
}

const Calendar: React.FC<CalendarProps> = ({ events = [] }) => {
   const today = dayjs();
   const [eventModal, setEventModal] = useState(false);
   const [currentMonth, setCurrentMonth] = useState(today);
   const [selectedDate, setSelectedDate] = useState<string | null>(null);

   // Generate an array of the current month's days
   const startOfMonth = currentMonth.startOf('month');
   const endOfMonth = currentMonth.endOf('month');
   const daysInMonth = [];

   let day = startOfMonth;
   while (day.isBefore(endOfMonth, 'day')) {
      daysInMonth.push(day);
      day = day.add(1, 'day');
   }

   // Filter events for the current month
   const eventsForMonth = events.filter((event) =>
      dayjs(event.date).isBetween(startOfMonth, endOfMonth, 'day', '[]'),
   );

   // Function to handle date click
   const handleDateClick = (date: string) => {
      setSelectedDate(date);
      setEventModal(true);
   };

   // Find events for the selected date
   const selectedEvents = eventsForMonth.filter((event) => event.date === selectedDate);

   return (
      <div className="">
         <div className="flex items-center justify-between text-center mb-4">
            <h1 className="text-sm font-medium">{currentMonth.format('MMMM YYYY')}</h1>
            <div className="flex items-center gap-3">
               <button className="" onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>
                  <CaretIcon className="rotate-[180deg]" />
               </button>
               <button className="" onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>
                  <CaretIcon />
               </button>
            </div>
         </div>

         <hr className="mb-4 border-[0.5px] border-[#E4E5E7]" />

         <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
               <div key={d} className="text-center text-[0.65rem] uppercase font-medium">
                  {d}
               </div>
            ))}

            {daysInMonth.map((d) => {
               const dateStr = d.format('YYYY-MM-DD');
               const hasEvent = eventsForMonth.some((event) => event.date === dateStr);
               return (
                  <div
                     key={dateStr}
                     title={d.isToday() ? 'Today' : hasEvent ? 'Event' : ''}
                     className={`text-center flex items-center justify-center text-xs p-2 rounded-[50%] cursor-pointer ${
                        d.isToday() ? 'bg-blue-100 dark:bg-blue-500/20' : ''
                     } ${hasEvent ? 'bg-[#B28309] text-[#ffffff]' : ''}`}
                     onClick={() => handleDateClick(dateStr)}
                  >
                     {d.date()}
                  </div>
               );
            })}
         </div>

         <FullscreenModal open={eventModal} onClickAway={() => setEventModal((prev) => !prev)}>
            {selectedDate && (
               <div className="p-8 mt-4 text-[#0F2552] bg-gray-100 dark:bg-[#1a1a2e] dark:text-white/90 rounded-md">
                  <h2 className="font-bold text-lg">
                     Events on {dayjs(selectedDate).format('MMMM D, YYYY')}
                  </h2>
                  {selectedEvents.length > 0 ? (
                     selectedEvents.map((event) => (
                        <div key={event.id} className="mt-2">
                           <h3 className="font-semibold">{event.title}</h3>
                           <p className="opacity-70">{event.description}</p>
                        </div>
                     ))
                  ) : (
                     <p className="opacity-50">No scheduled maintenance for this day.</p>
                  )}
               </div>
            )}
         </FullscreenModal>
      </div>
   );
};

export default Calendar;
