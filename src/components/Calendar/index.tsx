'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import { generateUUID } from '@/utilities/helpers';
import isBetween from 'dayjs/plugin/isBetween';
import isToday from 'dayjs/plugin/isToday';
import { CaretIcon } from '../Icons';
import FullscreenModal from '../Modals';

type Event = {
  id: string;
  date: string; // The date of the event
  title: string; // The title of the event
  description: string; // Description of the event
};

dayjs.extend(isBetween);
dayjs.extend(isToday);

const Calendar: React.FC = () => {
  const today = dayjs(); // Get current date
  const [eventModal, setEventModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const events: Event[] = [
    {
      id: generateUUID(),
      date: today.date(5).format('YYYY-MM-DD'),
      title: 'Meeting with John',
      description: 'Discuss project updates.',
    },
    {
      id: generateUUID(),
      date: today.date(15).format('YYYY-MM-DD'),
      title: 'Doctor Appointment',
      description: 'Annual check-up.',
    },
    {
      id: generateUUID(),
      date: today.date(20).format('YYYY-MM-DD'),
      title: 'Conference',
      description: 'Tech conference in San Francisco.',
    },
  ];

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
    dayjs(event.date).isBetween(startOfMonth, endOfMonth, 'day', '[]')
  );

  // Function to handle date click
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setEventModal(true);
  };

  // Find events for the selected date
  const selectedEvents = eventsForMonth.filter(
    (event) => event.date === selectedDate
  );

  return (
    <div className="">
      <div className="flex items-center justify-between text-center mb-4">
        <h1 className="text-sm font-medium">
          {currentMonth.format('MMMM YYYY')}
        </h1>
        <div className="flex items-center gap-3">
          <button
            className=""
            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
          >
            <CaretIcon className="rotate-[180deg]" />
          </button>
          <button
            className=""
            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
          >
            <CaretIcon />
          </button>
        </div>
      </div>

      <hr className="mb-4 border-[0.5px] border-[#E4E5E7]" />

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-[0.65rem] uppercase font-medium"
          >
            {day}
          </div>
        ))}

                {daysInMonth.map(day => (
                    <div
                        key={day.format('YYYY-MM-DD')}
                        title={day.isToday() ? 'Today' : eventsForMonth.some(event => event.date === day.format('YYYY-MM-DD')) ? 'Event' : ''}
                        className={`text-center flex items-center justify-center text-xs p-2 rounded-[50%] cursor-pointer ${
                            day.isToday() ? 'bg-blue-100' : ''
                            } ${eventsForMonth.some(event => event.date === day.format('YYYY-MM-DD')) ? 'bg-[#B28309] text-[#ffffff]' : ''}`
                        }
                        onClick={() => handleDateClick(day.format('YYYY-MM-DD'))}
                    >
                        {day.date()}
                    </div>
                ))}
            </div>

      <FullscreenModal
        open={eventModal}
        onClickAway={() => setEventModal((prev) => !prev)}
      >
        {selectedDate && (
          <div className="p-8 mt-4 text-[#0F2552] bg-gray-100 rounded-md">
            <h2 className="font-bold text-lg">
              Events on {dayjs(selectedDate).format('MMMM D, YYYY')}
            </h2>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div key={event.id} className="mt-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p>{event.description}</p>
                </div>
              ))
            ) : (
              <p>No events for this day.</p>
            )}
          </div>
        )}
      </FullscreenModal>
    </div>
  );
};

export default Calendar;
