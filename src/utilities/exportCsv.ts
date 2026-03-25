import { format } from 'date-fns';

/**
 * Build a human-readable export filename.
 *
 * Examples:
 *   All records:  EGFM_Generator_Logs_15-Mar-2026.csv
 *   Date range:   EGFM_Generator_Logs_01-Jan-2026_to_15-Mar-2026.csv
 */
function buildFilename(label: string, from?: string, to?: string): string {
   const prefix = 'EGFM';
   const title = label
      .split(/[_\s]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('_');

   const formatDate = (d: string) => format(new Date(d), 'dd-MMM-yyyy');

   if (from && to) {
      return `${prefix}_${title}_${formatDate(from)}_to_${formatDate(to)}`;
   }
   if (from) {
      return `${prefix}_${title}_from_${formatDate(from)}`;
   }
   if (to) {
      return `${prefix}_${title}_to_${formatDate(to)}`;
   }
   return `${prefix}_${title}_${format(new Date(), 'dd-MMM-yyyy')}`;
}

/**
 * Export an array of objects as a CSV file download.
 *
 * @param label     – display name for the file (e.g. "Generator Logs")
 * @param rows      – array of data objects
 * @param columns   – column definitions: { key, header, format? }
 * @param dateRange – optional { from, to } for the filename
 */
export function exportToCsv<T extends Record<string, unknown>>(
   label: string,
   rows: T[],
   columns: { key: string; header: string; format?: (value: unknown, row: T) => string }[],
   dateRange?: { from?: string; to?: string },
) {
   if (rows.length === 0) return;

   const resolve = (row: T, key: string): unknown => {
      const parts = key.split('.');
      let val: unknown = row;
      for (const p of parts) {
         if (val == null) return '';
         val = (val as Record<string, unknown>)[p];
      }
      return val;
   };

   const escape = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
         return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
   };

   const headerRow = columns.map((c) => escape(c.header)).join(',');

   const dataRows = rows.map((row) =>
      columns
         .map((col) => {
            const raw = resolve(row, col.key);
            const formatted = col.format ? col.format(raw, row) : raw;
            return escape(formatted);
         })
         .join(','),
   );

   const csvContent = [headerRow, ...dataRows].join('\n');

   // BOM for Excel UTF-8 compatibility
   const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);

   const filename = buildFilename(label, dateRange?.from, dateRange?.to);

   const link = document.createElement('a');
   link.href = url;
   link.download = `${filename}.csv`;
   link.style.display = 'none';
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
   URL.revokeObjectURL(url);
}
