import React from 'react';

interface CardProps {
   children: React.ReactNode;
   className?: string;
   style?: React.CSSProperties;
}

/**
 * Shared card shell used across Dashboard and Analytics.
 *
 * Background and border come from CSS vars so the same shell looks
 * right in both light and dark modes. Pass `className` for layout-
 * related additions (grid placement, max-height, etc.) — do not
 * override the body styling here, that breaks visual consistency.
 */
const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
   <div
      className={`rounded-2xl p-5 md:p-6 transition-colors ${className}`}
      style={{
         background: 'var(--surface-paper)',
         border: '1px solid var(--border-default)',
         ...style,
      }}
   >
      {children}
   </div>
);

export default Card;
