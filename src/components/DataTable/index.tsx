import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchIcon, CaretIcon } from '@/components/Icons';
import EmptyState from '@/components/EmptyState';

// ── Refresh icon (inline SVG) ──
const RefreshIcon: React.FC<{ spinning: boolean }> = ({ spinning }) => (
   <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
         display: 'inline-block',
         transition: 'transform 500ms ease',
         transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
      }}
   >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
   </svg>
);

// ── Types ──

export type Column<T> = {
   key: keyof T | string;
   header: string;
   render?: (value: unknown, row: T, index: number) => React.ReactNode;
   width?: string;
   align?: 'left' | 'center' | 'right';
   sortable?: boolean;
   hidden?: boolean;
};

export interface FilterDef {
   key: string;
   label: string;
   options: { value: string; label: string }[];
}

interface PaginationMeta {
   currentPage: number;
   totalItems: number;
   itemsPerPage: number;
   totalPages: number;
}

interface DataTableProps<T> {
   columns: Column<T>[];
   data: T[];
   loading?: boolean;
   pagination?: PaginationMeta;
   onPageChange?: (page: number) => void;
   onSearch?: (query: string) => void;
   searchPlaceholder?: string;
   filters?: FilterDef[];
   filterValues?: Record<string, string>;
   onFilterChange?: (key: string, value: string) => void;
   onRowClick?: (row: T) => void;
   actions?: React.ReactNode;
   onExport?: () => void;
   onRefresh?: () => void;
   emptyTitle?: string;
   emptyDescription?: string;
   emptyAction?: React.ReactNode;
   className?: string;
   getRowId?: (row: T) => string | number;
}

// ── Skeleton ──

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
   <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
      {Array.from({ length: cols }).map((_, i) => (
         <td key={i} className="px-4 py-4">
            <div
               className="h-3.5 rounded-full animate-pulse"
               style={{ width: `${50 + Math.random() * 40}%`, background: 'var(--surface-medium)' }}
            />
         </td>
      ))}
   </tr>
);

// ── Filter chip ──

const FilterChip: React.FC<{ label: string; value: string; onClear: () => void }> = ({ label, value, onClear }) => (
   <span
      className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-1 rounded-md"
      style={{ background: 'var(--surface-medium)', color: 'var(--text-secondary)' }}
   >
      {label}: {value}
      <button onClick={onClear} className="ml-0.5 hover:opacity-70 cursor-pointer">
         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
         </svg>
      </button>
   </span>
);

// ── Main Component ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
   columns,
   data,
   loading = false,
   pagination,
   onPageChange,
   onSearch,
   searchPlaceholder = 'Search...',
   filters,
   filterValues = {},
   onFilterChange,
   onRowClick,
   actions,
   onExport,
   onRefresh,
   emptyTitle,
   emptyDescription,
   emptyAction,
   className = '',
   getRowId,
}: DataTableProps<T>) {
   const [searchValue, setSearchValue] = useState('');
   const [showFilters, setShowFilters] = useState(false);
   const [isRefreshSpinning, setIsRefreshSpinning] = useState(false);
   const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
   const visibleColumns = columns.filter((c) => !c.hidden);

   const activeFilterCount = Object.values(filterValues).filter((v) => v && v !== '').length;

   const handleRefreshClick = () => {
      if (!onRefresh || isRefreshSpinning) return;
      setIsRefreshSpinning(true);
      onRefresh();
      setTimeout(() => setIsRefreshSpinning(false), 600);
   };

   // Debounced search
   useEffect(() => {
      if (!onSearch) return;
      debounceRef.current = setTimeout(() => {
         onSearch(searchValue);
      }, 400);
      return () => clearTimeout(debounceRef.current);
   }, [searchValue, onSearch]);

   const getValue = useCallback((row: T, key: string) => {
      const parts = key.split('.');
      let val: unknown = row;
      for (const p of parts) {
         if (val == null) return undefined;
         val = (val as Record<string, unknown>)[p];
      }
      return val;
   }, []);

   // Pagination helpers
   const totalPages = pagination?.totalPages ?? 1;
   const currentPage = pagination?.currentPage ?? 1;
   const totalItems = pagination?.totalItems ?? data.length;
   const itemsPerPage = pagination?.itemsPerPage ?? data.length;
   const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
   const endItem = Math.min(currentPage * itemsPerPage, totalItems);

   const getPageNumbers = () => {
      const pages: (number | 'ellipsis')[] = [];
      if (totalPages <= 7) {
         for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
         pages.push(1);
         if (currentPage > 3) pages.push('ellipsis');
         const start = Math.max(2, currentPage - 1);
         const end = Math.min(totalPages - 1, currentPage + 1);
         for (let i = start; i <= end; i++) pages.push(i);
         if (currentPage < totalPages - 2) pages.push('ellipsis');
         pages.push(totalPages);
      }
      return pages;
   };

   return (
      <div
         className={`rounded-xl overflow-hidden transition-colors duration-200 ${className}`}
         style={{
            background: 'var(--surface-paper)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
         }}
      >
         {/* ── Loading bar ── */}
         {loading && (
            <div
               style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'var(--color-primary, #C9A84C)',
                  zIndex: 10,
                  overflow: 'hidden',
               }}
            >
               <div
                  style={{
                     height: '100%',
                     width: '40%',
                     background: 'var(--color-secondary, #F5D078)',
                     animation: 'datatableLoadBar 1.2s ease-in-out infinite',
                  }}
               />
               <style>{`
                  @keyframes datatableLoadBar {
                     0% { transform: translateX(-100%); }
                     100% { transform: translateX(350%); }
                  }
               `}</style>
            </div>
         )}
         {/* ── Toolbar ── */}
         {(onSearch || actions || onExport || onRefresh || filters) && (
            <div
               className="flex flex-col gap-3 px-4 sm:px-5 py-3.5"
               style={{ borderBottom: '1px solid var(--border-default)' }}
            >
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search */}
                  {onSearch && (
                     <div className="relative flex-1 max-w-sm">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-hint)' }} />
                        <input
                           type="text"
                           value={searchValue}
                           onChange={(e) => setSearchValue(e.target.value)}
                           placeholder={searchPlaceholder}
                           className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
                           style={{
                              background: 'var(--surface-low)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                           }}
                        />
                     </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                     {/* Filter toggle */}
                     {filters && filters.length > 0 && (
                        <button
                           onClick={() => setShowFilters((prev) => !prev)}
                           className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer"
                           style={{
                              border: '1px solid var(--border-strong)',
                              color: activeFilterCount > 0 ? 'var(--color-secondary)' : 'var(--text-secondary)',
                              background: showFilters ? 'var(--surface-low)' : 'transparent',
                           }}
                        >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                           </svg>
                           Filters
                           {activeFilterCount > 0 && (
                              <span
                                 className="ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[0.6rem] font-bold rounded-full text-white"
                                 style={{ background: 'var(--color-secondary)' }}
                              >
                                 {activeFilterCount}
                              </span>
                           )}
                        </button>
                     )}

                     {/* Export */}
                     {onExport && (
                        <button
                           onClick={onExport}
                           disabled={data.length === 0}
                           className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                           style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                           title="Export as CSV"
                        >
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                           </svg>
                           Export
                        </button>
                     )}

                     {/* Refresh */}
                     {onRefresh && (
                        <button
                           onClick={handleRefreshClick}
                           disabled={loading}
                           className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                           style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                           title="Refresh"
                        >
                           <RefreshIcon spinning={isRefreshSpinning} />
                           Refresh
                        </button>
                     )}

                     {/* Extra actions */}
                     {actions}
                  </div>
               </div>

               {/* Filter bar */}
               {showFilters && filters && filters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-up">
                     {filters.map((f) => (
                        <select
                           key={f.key}
                           value={filterValues[f.key] ?? ''}
                           onChange={(e) => onFilterChange?.(f.key, e.target.value)}
                           className="text-xs font-medium px-2.5 py-1.5 rounded-lg outline-none cursor-pointer transition-all"
                           style={{
                              background: 'var(--surface-low)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--text-primary)',
                              minWidth: 130,
                           }}
                        >
                           <option value="">{f.label}</option>
                           {f.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                 {opt.label}
                              </option>
                           ))}
                        </select>
                     ))}

                     {/* Active filter chips */}
                     {activeFilterCount > 0 && (
                        <>
                           <div className="h-5 w-px mx-1" style={{ background: 'var(--border-strong)' }} />
                           {Object.entries(filterValues)
                              .filter(([, v]) => v && v !== '')
                              .map(([key, value]) => {
                                 const def = filters.find((f) => f.key === key);
                                 const optLabel = def?.options.find((o) => o.value === value)?.label ?? value;
                                 return (
                                    <FilterChip
                                       key={key}
                                       label={def?.label ?? key}
                                       value={optLabel}
                                       onClear={() => onFilterChange?.(key, '')}
                                    />
                                 );
                              })}
                        </>
                     )}
                  </div>
               )}
            </div>
         )}

         {/* ── Table ── */}
         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border-default)' }}>
                     {visibleColumns.map((col) => (
                        <th
                           key={String(col.key)}
                           className={`px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-wider whitespace-nowrap ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                           }`}
                           style={{ color: 'var(--text-hint)', width: col.width }}
                        >
                           {col.header}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                     Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={visibleColumns.length} />)
                  ) : data.length === 0 ? (
                     <tr>
                        <td colSpan={visibleColumns.length}>
                           <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                        </td>
                     </tr>
                  ) : (
                     data.map((row, rowIndex) => {
                        const rowId = getRowId ? getRowId(row) : (row.id as string | number) ?? rowIndex;
                        return (
                           <tr
                              key={rowId}
                              onClick={() => onRowClick?.(row)}
                              className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                              style={{
                                 borderBottom: '1px solid var(--border-default)',
                                 background: rowIndex % 2 === 0 ? 'transparent' : 'var(--surface-low)',
                              }}
                              onMouseEnter={(e) => {
                                 e.currentTarget.style.background = 'var(--surface-medium)';
                              }}
                              onMouseLeave={(e) => {
                                 e.currentTarget.style.background = rowIndex % 2 === 0 ? 'transparent' : 'var(--surface-low)';
                              }}
                           >
                              {visibleColumns.map((col) => {
                                 const val = getValue(row, String(col.key));
                                 return (
                                    <td
                                       key={String(col.key)}
                                       className={`px-4 py-3.5 text-[0.8rem] whitespace-nowrap ${
                                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                                       }`}
                                       style={{ color: 'var(--text-primary)' }}
                                    >
                                       {col.render
                                          ? col.render(val, row, rowIndex)
                                          : val != null && String(val) !== ''
                                            ? String(val)
                                            : <span style={{ color: 'var(--text-hint)', opacity: 0.5 }}>{'\u2014'}</span>}
                                    </td>
                                 );
                              })}
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>

         {/* ── Footer / Pagination ── */}
         {(pagination || data.length > 0) && (
            <div
               className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5"
               style={{ borderTop: '1px solid var(--border-default)', background: 'var(--surface-low)' }}
            >
               <span className="text-xs" style={{ color: 'var(--text-hint)' }}>
                  Showing{' '}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                     {startItem}–{endItem}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                     {totalItems}
                  </span>{' '}
                  results
               </span>

               <div className={`flex items-center gap-1 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <button
                     disabled={currentPage <= 1 || loading}
                     onClick={() => onPageChange?.(currentPage - 1)}
                     className="p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     <CaretIcon className="rotate-180 w-3 h-3" />
                  </button>

                  {getPageNumbers().map((p, i) =>
                     p === 'ellipsis' ? (
                        <span key={`e${i}`} className="px-1 text-xs" style={{ color: 'var(--text-disabled)' }}>
                           ...
                        </span>
                     ) : (
                        <button
                           key={p}
                           disabled={loading}
                           onClick={() => onPageChange?.(p as number)}
                           className="min-w-[32px] h-8 rounded-md text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed"
                           style={
                              p === currentPage
                                 ? { background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-sm)' }
                                 : { color: 'var(--text-secondary)' }
                           }
                        >
                           {p}
                        </button>
                     ),
                  )}

                  <button
                     disabled={currentPage >= totalPages || loading}
                     onClick={() => onPageChange?.(currentPage + 1)}
                     className="p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     <CaretIcon className="w-3 h-3" />
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}

export default DataTable;
