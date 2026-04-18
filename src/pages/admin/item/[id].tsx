import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { itemConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { capitalizeFirstLetter, formatReadableDate } from '@/utilities/helpers';
import { formatNumber } from '@/components/FormatValue';
import { itemActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import SmallSelect from '@/components/CustomDropdownSelect/SmallSelect';
import StatusChip from '@/components/StatusChip';
import { DetailRow, DetailSection } from '@/components/DetailField';
import PageHeader, { ActionButton } from '@/components/PageHeader';

const conditionOptions = [
   { value: 'Good', label: 'Good' },
   { value: 'Bad', label: 'Bad' },
   { value: 'Not specified', label: 'Not specified' },
];

interface ItemDetails {
   name: string;
   actualQuantity: number;
   availableQuantity: number;
   fragile: boolean;
   trackingMode?: string;
   department: { name: string };
   itemUnits: Array<{
      id: number;
      condition: string;
      serialNumber: string;
      store: {
         id: number;
         name: string;
         status: string;
         location: string | null;
         createdAt: string;
         createdBy: string;
         updatedAt: string | null;
         updatedBy: string | null;
      };
   }>;
   createdBy: string;
   createdAt: string;
}

interface ItemDetailsProps {
   itemDetail: ItemDetails;
}

export const getServerSideProps: GetServerSideProps<ItemDetailsProps> = async (ctx) => {
   const { id } = ctx.params || {};
   if (!id || Array.isArray(id) || isNaN(Number(id))) {
      return { notFound: true };
   }

   const cookies = parseCookies(ctx);
   const authToken = cookies?.authToken;

   if (!authToken) {
      return { redirect: { destination: '/login', permanent: false } };
   }

   try {
      const resp = await axios.get(`${itemConstants.ITEM_URI}/detail/${id}`, {
         headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (resp?.status !== 200) return { notFound: true };
      return { props: { itemDetail: resp.data?.data ?? null } };
   } catch {
      return { props: { itemDetail: null } };
   }
};

const ItemViewPage: NextPage<ItemDetailsProps> = ({ itemDetail }) => {
   const router = useRouter();
   const { id } = router.query;
   const dispatch = useDispatch();
   const { IsUpdatingItem } = useSelector((s: RootState) => s.item);
   const { allStoresList } = useSelector((s: RootState) => s.store);

   const [selectedStores, setSelectedStores] = useState(
      itemDetail?.itemUnits?.map((u) => String(u.store?.id) || '') || [],
   );
   const [selectedConditions, setSelectedConditions] = useState(
      itemDetail?.itemUnits?.map((u) => u.condition || '') || [],
   );
   const [initialConditions] = useState(
      itemDetail?.itemUnits?.map((u) => u.condition || '') || [],
   );
   const [initialStores] = useState(
      itemDetail?.itemUnits?.map((u) => String(u.store?.id) || '') || [],
   );

   const arraysEqual = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((v, i) => v === b[i]);
   const isUpdateDisabled = arraysEqual(selectedConditions, initialConditions) && arraysEqual(selectedStores, initialStores);

   const handleStoreChange = (index: number, value: string) => {
      const updated = [...selectedStores];
      updated[index] = value;
      setSelectedStores(updated);
   };

   const handleConditionChange = (index: number, value: string) => {
      const updated = [...selectedConditions];
      updated[index] = value;
      setSelectedConditions(updated);
   };

   const handleUpdateItem = () => {
      const updatedItemUnits = itemDetail.itemUnits.map((unit, index) => {
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
         const { serialNumber, store, ...rest } = unit;
         return { ...rest, condition: selectedConditions[index], storeId: Number(selectedStores[index]) };
      });
      dispatch(itemActions.updateItem({ itemId: id as string, itemUnits: updatedItemUnits }) as unknown as UnknownAction);
   };

   if (!itemDetail) {
      return (
         <Layout title="Item Details">
            <div className="flex items-center justify-center h-64">
               <p className="text-sm text-gray-400 dark:text-white/40">Item not found.</p>
            </div>
         </Layout>
      );
   }

   return (
      <Layout title="Item Details">
         <div className="max-w-5xl mx-auto space-y-5">
            <PageHeader title="Item Details" showBreadcrumbs />
            {/* ── Back button ── */}
            <button
               onClick={() => router.back()}
               className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40 hover:text-[#0F2552] dark:hover:text-white/70 transition-colors cursor-pointer"
            >
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
               </svg>
               Back to Items
            </button>

            {/* ── Header card ── */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/8 shadow-sm p-5 sm:p-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
                           {capitalizeFirstLetter(itemDetail.name)}
                        </h1>
                        <StatusChip status={itemDetail.fragile ? 'yes' : 'no'} size="sm" />
                        <span className="text-[0.6rem] uppercase font-semibold text-gray-300 dark:text-white/25">
                           {itemDetail.fragile ? 'Fragile' : 'Not Fragile'}
                        </span>
                     </div>
                     <p className="text-xs text-gray-400 dark:text-white/40">
                        {itemDetail.department?.name} &middot; Created by {itemDetail.createdBy} &middot;{' '}
                        {formatReadableDate(itemDetail.createdAt)}
                     </p>
                  </div>

                  {/* Quantity badges */}
                  <div className="flex items-center gap-3">
                     <div className="text-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
                        <span className="block text-lg font-bold text-[#0F2552] dark:text-white/90">{formatNumber(itemDetail.actualQuantity)}</span>
                        <span className="text-[0.6rem] uppercase font-semibold text-gray-400 dark:text-white/35">Total</span>
                     </div>
                     <div className="text-center px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/15">
                        <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(itemDetail.availableQuantity)}</span>
                        <span className="text-[0.6rem] uppercase font-semibold text-emerald-500/70 dark:text-emerald-400/50">Available</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* ── Overview section ── */}
            <DetailSection title="Overview">
               <div className="grid grid-cols-1 sm:grid-cols-2">
                  <DetailRow label="Item Name" value={capitalizeFirstLetter(itemDetail.name)} />
                  <DetailRow label="Department" value={itemDetail.department?.name} />
                  <DetailRow label="Actual Quantity" value={formatNumber(itemDetail.actualQuantity)} />
                  <DetailRow label="Available Quantity" value={formatNumber(itemDetail.availableQuantity)} />
                  <DetailRow label="Fragile" value={<StatusChip status={itemDetail.fragile ? 'yes' : 'no'} />} />
                  <DetailRow
                     label="Tracking Mode"
                     value={itemDetail.trackingMode === 'Serialized' ? 'Serialized' : 'Quantity Only'}
                  />
                  <DetailRow label="Created By" value={itemDetail.createdBy} />
                  <DetailRow label="Created Date" value={formatReadableDate(itemDetail.createdAt)} />
               </div>
            </DetailSection>

            {/* ── Item Units section (Serialized items only) ── */}
            {itemDetail.trackingMode === 'Serialized' && (
               <DetailSection
                  title={`Item Units (${itemDetail.itemUnits?.length ?? 0})`}
                  action={
                     <ActionButton
                        variant="primary"
                        onClick={handleUpdateItem}
                        disabled={isUpdateDisabled || IsUpdatingItem}
                     >
                        {IsUpdatingItem ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                           'Save Changes'
                        )}
                     </ActionButton>
                  }
               >
                  {itemDetail.itemUnits && itemDetail.itemUnits.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead>
                              <tr className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">Serial Number</th>
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">ID</th>
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">Condition</th>
                                 <th className="px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35 text-left">Store</th>
                              </tr>
                           </thead>
                           <tbody>
                              {itemDetail.itemUnits.map((unit, index) => (
                                 <tr
                                    key={unit.id}
                                    className={`border-b border-gray-50 dark:border-white/[0.03] last:border-b-0 ${
                                       index % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-white/[0.01]'
                                    }`}
                                 >
                                    <td className="px-4 py-3 text-sm font-mono text-[#0F2552] dark:text-white/75">
                                       {unit.serialNumber}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-white/40">
                                       #{unit.id}
                                    </td>
                                    <td className="px-4 py-3">
                                       <SmallSelect
                                          value={selectedConditions[index]}
                                          options={conditionOptions}
                                          placeholder="Select condition"
                                          onChange={(value) => handleConditionChange(index, value as string)}
                                       />
                                    </td>
                                    <td className="px-4 py-3">
                                       <SmallSelect
                                          value={selectedStores[index]}
                                          options={allStoresList.map((store) => ({
                                             value: String(store.id),
                                             label: store.name,
                                          }))}
                                          placeholder="Select store"
                                          onChange={(value) => handleStoreChange(index, String(value))}
                                       />
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  ) : (
                     <div className="py-12 text-center text-sm text-gray-400 dark:text-white/30">
                        No item units registered
                     </div>
                  )}
               </DetailSection>
            )}
         </div>
      </Layout>
   );
};

export default ItemViewPage;
