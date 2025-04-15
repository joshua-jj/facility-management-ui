import React from 'react';
import { CaretIcon } from '../Icons';

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  // onPageSizeChange,
  // pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // const startItem = (currentPage - 1) * pageSize + 1;
  // const endItem = Math.min(startItem + pageSize - 1, totalItems);

  return (
    <div className="flex flex-wrap justify-between items-center px-6 py-4 gap-4">
      {/* <p className="text-sm text-gray-600">
                Showing {startItem} - {endItem} of {totalItems}
            </p> */}

      {/* <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Page size:</label>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="rounded border-gray-300 text-sm shadow-sm"
                >
                {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                        {size} / page
                    </option>
                ))}
                </select>
            </div> */}

      <div className="flex items-center gap-2">
        <label htmlFor="jump" className="text-sm text-gray-600">
          Go to page:
        </label>
        <select
          id="jump"
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="rounded-[16px] px-3 py-1 border-[rgba(15,37,82,0.15)] text-sm shadow-sm"
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i + 1} value={i + 1} className="">
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="rotate-[180deg] rounded-[50%] text-xs font-medium text-center h-[2rem] w-[2rem] border border-[rgba(15,37,82,0.15)] hover:border-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed bg-transparent hover:bg-gray-300 disabled:opacity-50"
        >
          <CaretIcon />
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-[50%] text-xs font-medium text-center h-[2rem] w-[2rem] ${
              page === currentPage
                ? 'bg-[#B28309] text-white cursor-pointer'
                : 'bg-transparent hover:bg-[#B2830998] hover:text-white text-gray-700 cursor-pointer disabled:cursor-not-allowed'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="rounded-[50%] text-xs font-medium text-center h-[2rem] w-[2rem] border border-[rgba(15,37,82,0.15)] hover:border-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed bg-transparent hover:bg-gray-300 disabled:opacity-50"
        >
          <CaretIcon />
        </button>
      </div>
    </div>
  );
};
