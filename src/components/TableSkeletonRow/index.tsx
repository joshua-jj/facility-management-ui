import React from 'react';

type Props = {
   /** How many cells to render */
   cols: number;
   /** Optional fixed widths per column (e.g. ['30%', '20%']). Falls back to random 50-90%. */
   widths?: string[];
};

/** Single skeleton row for shimmering table placeholders while data loads. */
const TableSkeletonRow: React.FC<Props> = ({ cols, widths }) => (
   <tr className="border-b border-gray-100 dark:border-white/5 last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
         <td key={i} className="px-6 py-4">
            <div
               className="h-3.5 rounded-full animate-pulse bg-gray-200 dark:bg-white/10"
               style={{ width: widths?.[i] ?? `${50 + ((i * 17) % 40)}%` }}
            />
         </td>
      ))}
   </tr>
);

export default TableSkeletonRow;
