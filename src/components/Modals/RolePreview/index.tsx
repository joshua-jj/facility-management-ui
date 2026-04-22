import React, { FC, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { roleActions, permissionActions } from '@/actions';
import PermissionGrid from '@/components/PermissionGrid';

type Props = {
   roleId: number | null;
   isOpen: boolean;
   onClose: () => void;
};

const ShieldIcon: FC = () => (
   <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
   </svg>
);

const EyeIcon: FC = () => (
   <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const RolePreview: FC<Props> = ({ roleId, isOpen, onClose }) => {
   const dispatch = useDispatch();
   const { selectedRole } = useSelector((s: RootState) => s.role);
   const { allPermissionsList } = useSelector((s: RootState) => s.permission);

   useEffect(() => {
      if (!isOpen || roleId == null) return;
      dispatch(roleActions.getRole(roleId) as unknown as UnknownAction);
      if (!allPermissionsList || allPermissionsList.length === 0) {
         dispatch(permissionActions.getPermissions() as unknown as UnknownAction);
      }
   }, [isOpen, roleId, dispatch, allPermissionsList]);

   const checkedIds = useMemo(() => {
      const set = new Set<number>();
      selectedRole?.permissions?.forEach((p: { id: number }) => set.add(p.id));
      return set;
   }, [selectedRole]);

   if (!isOpen) return null;
   if (typeof document === 'undefined') return null; // SSR guard

   return createPortal(
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
         <div className="bg-[#0e0e1a] rounded-2xl w-full max-w-2xl max-h-[80vh] border border-white/10 flex flex-col">
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
               <h2 className="text-lg font-bold text-white">Role Preview</h2>
               <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white cursor-pointer"
                  aria-label="Close"
               >
                  ✕
               </button>
            </div>

            {selectedRole ? (
               <>
                  {/* Sticky role card */}
                  <div className="px-6 pt-6 pb-4 shrink-0">
                     <div className="flex items-start gap-4 p-5 rounded-xl border border-white/15">
                        <div className="text-white/90 shrink-0 mt-1">
                           <ShieldIcon />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-white">{selectedRole.name}</h3>
                           <p className="text-sm text-white/70 mt-1.5">
                              {selectedRole.description ?? 'No description provided.'}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Sticky section header */}
                  <div className="px-6 pb-3 shrink-0">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                           <EyeIcon />
                           <h4 className="font-bold">Hierarchical Permissions</h4>
                        </div>
                        {selectedRole.preset && (
                           <span className="text-[0.65rem] text-white/50 uppercase tracking-[0.1em]">
                              SYSTEM PRESET
                           </span>
                        )}
                     </div>
                  </div>

                  {/* Scrollable permissions list */}
                  <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6">
                     <PermissionGrid
                        permissions={allPermissionsList ?? []}
                        value={checkedIds}
                        onChange={() => undefined}
                        readOnly
                        variant="preview"
                     />
                  </div>
               </>
            ) : (
               <div className="flex-1 p-6 text-sm text-white/60">Loading…</div>
            )}
         </div>
      </div>,
      document.body,
   );
};

export default RolePreview;
