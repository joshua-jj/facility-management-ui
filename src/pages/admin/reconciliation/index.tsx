import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { RootState } from '@/redux/reducers';
import { reconciliationActions } from '@/actions';
import { ReconciliationSession, ReconciliationState } from '@/types';
import { DataTable, Column, FilterDef } from '@/components/DataTable';
import PageHeader, { ActionButton } from '@/components/PageHeader';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import PrivateRoute from '@/components/PrivateRoute';
import RoleGuard from '@/components/shared/RoleGuard';
import OpenReconciliation from '@/components/Modals/OpenReconciliation';
import { reconciliationConstants } from '@/constants';
import { AppEmitter } from '@/controllers/EventEmitter';
import { Permission } from '@/constants/permissions.enum';

const PAGE_LIMIT = 10;

/** State → badge colours (brand-consistent: gold for in-flight, green done, red rejected). */
const STATE_BADGE: Record<ReconciliationState, { bg: string; color: string; label: string }> = {
   DRAFT: { bg: 'rgba(107, 114, 128, 0.12)', color: 'rgb(75, 85, 99)', label: 'Draft' },
   SUBMITTED: { bg: 'rgba(178, 131, 9, 0.14)', color: 'var(--color-secondary)', label: 'Submitted' },
   POSTED: { bg: 'rgba(22, 163, 74, 0.12)', color: 'rgb(21, 128, 61)', label: 'Posted' },
   REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)', label: 'Rejected' },
};

const StateBadge: React.FC<{ state?: ReconciliationState }> = ({ state }) => {
   const meta = (state && STATE_BADGE[state]) || {
      bg: 'rgba(107, 114, 128, 0.12)',
      color: 'rgb(75, 85, 99)',
      label: state ?? '—',
   };
   return (
      <span
         className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold"
         style={{ background: meta.bg, color: meta.color }}
      >
         {meta.label}
      </span>
   );
};

/**
 * Resolve the human scope label. The session may carry a nested
 * `department`/`category` object (with a `name`) or just the id —
 * handle both, falling back to the scopeType + id.
 */
const resolveScope = (row: ReconciliationSession): string => {
   const r = row as ReconciliationSession & {
      department?: { name?: string } | null;
      category?: { name?: string } | null;
   };
   if (row.scopeType === 'DEPARTMENT') {
      return r.department?.name ?? (row.departmentId != null ? `Department #${row.departmentId}` : 'Department');
   }
   if (row.scopeType === 'CATEGORY') {
      return r.category?.name ?? (row.categoryId != null ? `Category #${row.categoryId}` : 'Category');
   }
   return row.scopeType ?? '—';
};

/** Count of lines with a non-zero variance; '—' when lines aren't loaded. */
const varianceCount = (row: ReconciliationSession): string => {
   if (!Array.isArray(row.lines) || row.lines.length === 0) return '—';
   return String(row.lines.filter((l) => Number(l.variance) !== 0).length);
};

const formatDate = (value: unknown): string => {
   if (!value) return '—';
   try {
      return format(parseISO(String(value)), 'MMM d, yyyy');
   } catch {
      return '—';
   }
};

const Reconciliation: NextPageWithLayout = () => {
   const dispatch = useDispatch();
   const router = useRouter();

   const { IsRequestingReconciliations, allReconciliationsList, pagination } = useSelector(
      (s: RootState) => s.reconciliation,
   );
   const { meta } = pagination;
   const { currentPage, itemsPerPage, totalItems, totalPages } = meta;

   const [filterValues, setFilterValues] = useState<Record<string, string>>({});

   const buildQuery = useCallback(
      (values: Record<string, string>, page = 1) => ({
         page,
         limit: PAGE_LIMIT,
         ...(values.state ? { state: values.state as ReconciliationState } : {}),
      }),
      [],
   );

   useEffect(() => {
      dispatch(reconciliationActions.getReconciliations(buildQuery(filterValues)) as unknown as UnknownAction);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [dispatch]);

   // Refresh the list after a session is opened (harmless even though the
   // modal redirects on success).
   useEffect(() => {
      const subscription = AppEmitter.addListener(
         reconciliationConstants.OPEN_RECONCILIATION_SUCCESS,
         () =>
            dispatch(
               reconciliationActions.getReconciliations(buildQuery(filterValues, currentPage || 1)) as unknown as UnknownAction,
            ),
      );
      return () => subscription.remove();
   }, [dispatch, buildQuery, filterValues, currentPage]);

   const handleChangePage = (page: number) => {
      dispatch(reconciliationActions.getReconciliations(buildQuery(filterValues, page)) as unknown as UnknownAction);
   };

   const handleFilterChange = (key: string, value: string) => {
      const newValues = { ...filterValues, [key]: value };
      setFilterValues(newValues);
      dispatch(reconciliationActions.getReconciliations(buildQuery(newValues, 1)) as unknown as UnknownAction);
   };

   const filters: FilterDef[] = useMemo(
      () => [
         {
            key: 'state',
            label: 'All States',
            options: [
               { value: 'DRAFT', label: 'Draft' },
               { value: 'SUBMITTED', label: 'Submitted' },
               { value: 'POSTED', label: 'Posted' },
               { value: 'REJECTED', label: 'Rejected' },
            ],
         },
      ],
      [],
   );

   const columns: Column<ReconciliationSession>[] = [
      {
         key: 'reference',
         header: 'Reference',
         render: (value) => <span className="font-medium">{String(value ?? '—')}</span>,
      },
      {
         key: 'scopeType',
         header: 'Scope',
         render: (_value, row) => <span>{resolveScope(row)}</span>,
      },
      {
         key: 'state',
         header: 'State',
         render: (_value, row) => <StateBadge state={row.state} />,
      },
      {
         key: 'createdBy',
         header: 'Counter',
         render: (value) => <span>{String(value || '—')}</span>,
      },
      {
         key: 'lines',
         header: 'Variances',
         align: 'center',
         render: (_value, row) => <span>{varianceCount(row)}</span>,
      },
      {
         key: 'createdAt',
         header: 'Date',
         render: (value) => <span>{formatDate(value)}</span>,
      },
   ];

   return (
      <>
         <PageHeader
            action={
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={() => router.push('/admin/reconciliation/report')}
                     className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                     style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' }}
                  >
                     Variance Report
                  </button>
                  <RoleGuard permission={Permission.RECONCILIATION_COUNT}>
                     <OpenReconciliation>
                        <ActionButton>New Count</ActionButton>
                     </OpenReconciliation>
                  </RoleGuard>
               </div>
            }
         />

         <DataTable
            columns={columns}
            data={allReconciliationsList ?? []}
            loading={!!IsRequestingReconciliations}
            onRowClick={(row) => router.push(`/admin/reconciliation/${row.id}`)}
            onRefresh={() =>
               dispatch(
                  reconciliationActions.getReconciliations(buildQuery(filterValues, currentPage || 1)) as unknown as UnknownAction,
               )
            }
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            pagination={{ currentPage, totalItems, itemsPerPage, totalPages }}
            onPageChange={handleChangePage}
            emptyTitle="No reconciliation sessions found"
            emptyDescription="Start a new count session to reconcile inventory."
         />
      </>
   );
};

Reconciliation.getLayout = (page) => (
   <PrivateRoute permissions={[Permission.RECONCILIATION_READ]}>
      <Layout title="Reconciliation">{page}</Layout>
   </PrivateRoute>
);

export default Reconciliation;
