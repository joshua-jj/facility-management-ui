import * as XLSX from 'xlsx';

export interface XlsxColumn<T = Record<string, unknown>> {
   key: keyof T | string;
   header: string;
   width?: number;
   format?: (value: unknown, row: T) => string | number | Date | null;
}

export function exportToXlsx<T extends Record<string, unknown>>(
   filename: string,
   rows: T[],
   columns: XlsxColumn<T>[],
): void {
   const data = rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const col of columns) {
         const raw = (row as Record<string, unknown>)[col.key as string];
         const value = col.format ? col.format(raw, row) : (raw ?? '');
         out[col.header] = value;
      }
      return out;
   });

   const sheet = XLSX.utils.json_to_sheet(data, { cellDates: true });
   sheet['!cols'] = columns.map((c) => ({ wch: c.width ?? Math.max(c.header.length + 2, 18) }));

   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
   XLSX.writeFile(workbook, `${filename}.xlsx`, { cellDates: true });
}
