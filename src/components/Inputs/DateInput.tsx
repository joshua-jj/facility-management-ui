import React, { useState, useRef, useEffect, useCallback } from 'react';
import { withFormsy } from 'formsy-react';
import dayjs from 'dayjs';

// ── Types ──

type DateMode = 'date' | 'datetime';

interface DateInputProps {
   label?: string;
   name: string;
   value?: string;
   required?: boolean;
   className?: string;
   mode?: DateMode;
   minDate?: string;
   maxDate?: string;
   placeholder?: string;
   setValue: (value: string) => void;
   onValueChange?: (value: string) => void;
   errorMessage?: string;
   isPristine?: boolean;
}

// ── Month/year names ──

const MONTH_NAMES = [
   'January', 'February', 'March', 'April', 'May', 'June',
   'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ── Helpers ──

function getDaysInMonth(year: number, month: number): number {
   return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
   return new Date(year, month, 1).getDay();
}

function formatDisplay(value: string, mode: DateMode): string {
   if (!value) return '';
   const d = dayjs(value);
   if (!d.isValid()) return '';
   return mode === 'datetime'
      ? d.format('MMM D, YYYY [at] h:mm A')
      : d.format('MMM D, YYYY');
}

function formatRelative(value: string): string {
   if (!value) return '';
   const d = dayjs(value);
   if (!d.isValid()) return '';
   const now = dayjs();
   const diff = d.diff(now, 'day');
   if (diff === 0) return 'Today';
   if (diff === 1) return 'Tomorrow';
   if (diff === -1) return 'Yesterday';
   if (diff > 1 && diff <= 7) return `In ${diff} days`;
   if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`;
   return d.format('dddd');
}

// ── Component ──

const DateInput: React.FC<DateInputProps> = (props) => {
   const {
      label,
      required,
      className,
      mode = 'date',
      placeholder,
      errorMessage,
      isPristine,
   } = props;

   const [open, setOpen] = useState(false);
   const [viewYear, setViewYear] = useState(dayjs().year());
   const [viewMonth, setViewMonth] = useState(dayjs().month());
   const [selectedDate, setSelectedDate] = useState(props.value || '');
   const [timeValue, setTimeValue] = useState('12:00');
   const wrapperRef = useRef<HTMLDivElement>(null);

   // Initialize from props
   useEffect(() => {
      if (props.value) {
         const d = dayjs(props.value);
         if (d.isValid()) {
            setSelectedDate(props.value);
            setViewYear(d.year());
            setViewMonth(d.month());
            if (mode === 'datetime') {
               setTimeValue(d.format('HH:mm'));
            }
         }
      }
   }, []); // eslint-disable-line react-hooks/exhaustive-deps

   // Close on outside click
   useEffect(() => {
      const handleClick = (e: MouseEvent) => {
         if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
   }, []);

   const commitValue = useCallback(
      (dateStr: string, time?: string) => {
         let val: string;
         if (mode === 'datetime') {
            const t = time ?? timeValue;
            val = `${dateStr}T${t}:00`;
         } else {
            val = dateStr;
         }
         setSelectedDate(val);
         props.setValue(val);
         props.onValueChange?.(val);
      },
      [mode, timeValue, props],
   );

   const handleDayClick = (day: number) => {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      commitValue(dateStr);
      if (mode === 'date') setOpen(false);
   };

   const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTimeValue(e.target.value);
      if (selectedDate) {
         const dateOnly = dayjs(selectedDate).format('YYYY-MM-DD');
         commitValue(dateOnly, e.target.value);
      }
   };

   const handlePrevMonth = () => {
      if (viewMonth === 0) {
         setViewMonth(11);
         setViewYear((y) => y - 1);
      } else {
         setViewMonth((m) => m - 1);
      }
   };

   const handleNextMonth = () => {
      if (viewMonth === 11) {
         setViewMonth(0);
         setViewYear((y) => y + 1);
      } else {
         setViewMonth((m) => m + 1);
      }
   };

   const handleToday = () => {
      const now = dayjs();
      setViewYear(now.year());
      setViewMonth(now.month());
      handleDayClick(now.date());
   };

   const handleClear = () => {
      setSelectedDate('');
      props.setValue('');
      props.onValueChange?.('');
      setOpen(false);
   };

   // Calendar grid
   const daysInMonth = getDaysInMonth(viewYear, viewMonth);
   const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
   const today = dayjs();
   const selectedDay = selectedDate ? dayjs(selectedDate) : null;

   const displayText = formatDisplay(selectedDate, mode);
   const relativeText = formatRelative(selectedDate);
   const hasError = errorMessage && !isPristine;

   return (
      <div ref={wrapperRef} className={`my-3 w-full relative ${className ?? ''}`}>
         <label className="block md:text-sm text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {required ? `${label}*` : label}
         </label>

         {/* Trigger button */}
         <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all cursor-pointer"
            style={{
               background: 'var(--surface-low)',
               border: hasError ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
               color: selectedDate ? 'var(--text-primary)' : 'var(--text-hint)',
            }}
         >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: 'var(--text-hint)' }}>
               <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
               <line x1="16" y1="2" x2="16" y2="6" />
               <line x1="8" y1="2" x2="8" y2="6" />
               <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="flex-1 truncate">
               {displayText || placeholder || 'Select a date'}
            </span>
            {relativeText && selectedDate && (
               <span className="text-[0.6rem] font-medium px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'var(--surface-medium)', color: 'var(--text-secondary)' }}>
                  {relativeText}
               </span>
            )}
         </button>

         {/* Error */}
         {hasError && <span className="text-red-500 text-xs mt-1 block">{errorMessage}</span>}

         {/* Dropdown calendar */}
         {open && (
            <div
               className="absolute z-50 mt-2 rounded-xl overflow-y-auto animate-dropdown-enter"
               style={{
                  background: 'var(--surface-paper)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
                  width: mode === 'datetime' ? 320 : 280,
                  maxHeight: 'min(26rem, calc(100vh - 8rem))',
               }}
            >
               {/* Month/Year header */}
               <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <button type="button" onClick={handlePrevMonth} className="p-1 rounded-md transition-colors cursor-pointer" style={{ color: 'var(--text-hint)' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                     {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button type="button" onClick={handleNextMonth} className="p-1 rounded-md transition-colors cursor-pointer" style={{ color: 'var(--text-hint)' }}>
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
               </div>

               {/* Day labels */}
               <div className="grid grid-cols-7 px-3 pt-2">
                  {DAY_LABELS.map((d) => (
                     <div key={d} className="text-center text-[0.6rem] font-semibold uppercase py-1" style={{ color: 'var(--text-hint)' }}>
                        {d}
                     </div>
                  ))}
               </div>

               {/* Day grid */}
               <div className="grid grid-cols-7 px-3 pb-2">
                  {/* Empty cells for days before the 1st */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                     <div key={`e${i}`} />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                     const day = i + 1;
                     const isToday = today.year() === viewYear && today.month() === viewMonth && today.date() === day;
                     const isSelected = selectedDay && selectedDay.year() === viewYear && selectedDay.month() === viewMonth && selectedDay.date() === day;

                     return (
                        <button
                           key={day}
                           type="button"
                           onClick={() => handleDayClick(day)}
                           className="flex items-center justify-center w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all cursor-pointer"
                           style={{
                              background: isSelected
                                 ? 'var(--color-secondary)'
                                 : isToday
                                   ? 'var(--surface-medium)'
                                   : 'transparent',
                              color: isSelected
                                 ? '#ffffff'
                                 : isToday
                                   ? 'var(--text-primary)'
                                   : 'var(--text-primary)',
                              fontWeight: isToday || isSelected ? 700 : 400,
                           }}
                        >
                           {day}
                        </button>
                     );
                  })}
               </div>

               {/* Time picker (datetime mode only) */}
               {mode === 'datetime' && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                     <label className="block text-[0.6rem] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-hint)' }}>
                        Time
                     </label>
                     <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                           background: 'var(--surface-low)',
                           border: '1px solid var(--border-default)',
                           color: 'var(--text-primary)',
                        }}
                     />
                  </div>
               )}

               {/* Footer */}
               <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <button
                     type="button"
                     onClick={handleClear}
                     className="text-[0.7rem] font-medium transition-colors cursor-pointer"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     Clear
                  </button>
                  <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={handleToday}
                        className="text-[0.7rem] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        style={{ color: 'var(--color-secondary)' }}
                     >
                        Today
                     </button>
                     {mode === 'datetime' && (
                        <button
                           type="button"
                           onClick={() => setOpen(false)}
                           className="text-[0.7rem] font-semibold px-3 py-1 rounded-md text-white cursor-pointer"
                           style={{ background: 'var(--color-secondary)' }}
                        >
                           Done
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default withFormsy(DateInput);
