/**
 * Typography scale for EGFM Facility Management System.
 * Uses Inter font loaded via next/font/google in _app.tsx.
 */

export const typography = {
   fontFamily: "var(--font-inter), 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

   /** Heading sizes */
   h1: { size: '1.5rem', weight: 800, lineHeight: 1.3, tracking: '-0.01em' },
   h2: { size: '1.25rem', weight: 700, lineHeight: 1.3, tracking: '-0.005em' },
   h3: { size: '1.125rem', weight: 700, lineHeight: 1.4, tracking: '0' },
   h4: { size: '1rem', weight: 600, lineHeight: 1.4, tracking: '0' },

   /** Body sizes */
   body: { size: '0.875rem', weight: 400, lineHeight: 1.5 },
   bodyMedium: { size: '0.875rem', weight: 500, lineHeight: 1.5 },
   bodySemibold: { size: '0.875rem', weight: 600, lineHeight: 1.5 },

   /** Small / Caption */
   small: { size: '0.8rem', weight: 400, lineHeight: 1.5 },
   caption: { size: '0.65rem', weight: 600, lineHeight: 1.4, tracking: '0.05em' },

   /** Labels */
   label: { size: '0.75rem', weight: 500, lineHeight: 1.4 },
   labelUppercase: { size: '0.65rem', weight: 600, lineHeight: 1.4, tracking: '0.08em' },

   /** Button */
   button: { size: '0.75rem', weight: 600, lineHeight: 1, tracking: '0' },
};
