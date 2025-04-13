import React from 'react';

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: string | number, row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T extends Record<string, any>>({
  columns,
  data,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto w-full rounded border border-gray-200 shadow-sm">
      <table className="min-w-full ">
        <thead className="bg-[#F2F2F2]">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700 text-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data?.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className="px-4 py-3 text-sm text-gray-800 text-nowrap"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
