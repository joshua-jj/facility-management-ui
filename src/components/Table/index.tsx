import React from 'react';

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: string | number, row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  searching?: boolean;
  currentPage?: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading,
  searching,
  currentPage,
}: TableProps<T>) {
  return (
    <div className="overflow-auto scrollbar-hidden w-full">
      {((data?.length === 0 || currentPage !== 1) && loading) || searching ? (
        <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
          <div className="w-8 h-8 border-4 border-[#B28309] border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <table className="min-w-full">
          <thead className="bg-[#F2F2F2] dark:bg-white/5 border-none">
            <tr className="border-none">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className="px-3 py-4 first:pl-6 text-left text-xs font-semibold text-gray-700 dark:text-white/60 text-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent">
            {data?.length > 0 ? (
              data?.map((row, rowIndex) => (
                <tr
                  key={(row.id as string | number) ?? rowIndex}
                  className="animate-row-enter hover:bg-gray-50 dark:hover:bg-white/5 border-b-[0.5px] border-[#E4E5E7] dark:border-white/10 transition-colors duration-150"
                  style={{ animationDelay: `${rowIndex * 0.03}s` }}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-3 py-4 first:pl-6 last:relative text-[0.8rem] text-gray-800 dark:text-white/70 text-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.key] as string | number, row)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-4 font-semibold"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
