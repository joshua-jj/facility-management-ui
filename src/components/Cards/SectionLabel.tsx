import React from 'react';

const ClockGlyph = () => (
   <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
      <line x1="6" y1="6" x2="6" y2="3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="6" x2="7.7" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
   </svg>
);

const SECTION_PILL_STYLE: React.CSSProperties = {
   background: 'var(--surface-medium)',
   color: 'var(--text-hint)',
   border: '1px solid var(--border-default)',
};

interface SectionLabelProps {
   children: React.ReactNode;
   className?: string;
}

/**
 * Small uppercase pill used as the "title" of every card. The clock
 * glyph matches the mockup's section markers.
 */
const SectionLabel: React.FC<SectionLabelProps> = ({ children, className = '' }) => (
   <span
      className={`inline-flex items-center gap-1.5 text-[0.55rem] uppercase tracking-widest font-semibold px-2.5 py-1.5 rounded-md ${className}`}
      style={SECTION_PILL_STYLE}
   >
      <ClockGlyph />
      {children}
   </span>
);

export default SectionLabel;
