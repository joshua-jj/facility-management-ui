import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { RootState } from '@/redux/reducers';
import { RoleId, RoleIdValue } from '@/constants/roles.constant';

export type SettingsPanelKey =
   | 'profile'
   | 'security'
   | 'access'
   | 'audit-logs';

type PanelEntry = {
   key: SettingsPanelKey;
   label: string;
   href: string;
   description: string;
   allowedRoles: readonly RoleIdValue[];
};

const ALL_ROLES: RoleIdValue[] = [
   RoleId.SUPER_ADMIN,
   RoleId.ADMIN,
   RoleId.OFFICE,
   RoleId.HOD,
   RoleId.MEMBER,
   RoleId.USER,
];

const ADMIN_ONLY: RoleIdValue[] = [RoleId.SUPER_ADMIN, RoleId.ADMIN];

const PANELS: PanelEntry[] = [
   {
      key: 'profile',
      label: 'Profile',
      href: '/admin/settings/profile',
      description: 'Your personal details',
      allowedRoles: ALL_ROLES,
   },
   {
      key: 'security',
      label: 'Security',
      href: '/admin/settings/security',
      description: 'Password and account hygiene',
      allowedRoles: ALL_ROLES,
   },
   {
      key: 'access',
      label: 'Roles & Permissions',
      href: '/admin/settings/access',
      description: 'Manage roles and permissions',
      allowedRoles: ADMIN_ONLY,
   },
   {
      key: 'audit-logs',
      label: 'Audit Logs',
      href: '/admin/settings/audit-logs',
      description: 'Who did what, when',
      allowedRoles: ADMIN_ONLY,
   },
];

type Props = {
   active: SettingsPanelKey;
   children: ReactNode;
};

const SettingsShell: React.FC<Props> = ({ active, children }) => {
   const router = useRouter();
   const { userDetails } = useSelector((s: RootState) => s.user);
   const roleId = userDetails?.roleId as RoleIdValue | undefined;

   const visiblePanels = PANELS.filter((p) =>
      roleId !== undefined ? p.allowedRoles.includes(roleId) : false,
   );

   // Defense-in-depth: if the user hit a URL whose panel they can't access,
   // bounce them to Profile. The left-rail already hides it, but typed URLs
   // shouldn't bypass gating.
   React.useEffect(() => {
      const activePanel = PANELS.find((p) => p.key === active);
      if (!activePanel) return;
      if (roleId === undefined) return;
      if (!activePanel.allowedRoles.includes(roleId)) {
         router.replace('/admin/settings/profile');
      }
   }, [active, roleId, router]);

   return (
      <div className="max-w-6xl mx-auto">
         <div className="mb-6">
            <h1 className="text-xl font-bold text-[#0F2552] dark:text-white/90">
               Settings
            </h1>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
               Manage your account, access, and audit trail
            </p>
         </div>

         <div className="flex flex-col md:flex-row gap-6">
            {/* Secondary left-rail */}
            <aside className="md:w-64 shrink-0">
               <nav className="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 shadow-sm overflow-hidden">
                  <ul>
                     {visiblePanels.map((panel) => {
                        const isActive = panel.key === active;
                        return (
                           <li key={panel.key}>
                              <Link
                                 href={panel.href}
                                 className={classNames(
                                    'block px-4 py-3 border-l-2 transition-colors',
                                    isActive
                                       ? 'border-[#B28309] bg-[#B28309]/5 text-[#B28309]'
                                       : 'border-transparent text-[#0F2552]/70 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5',
                                 )}
                              >
                                 <div className="text-sm font-semibold">
                                    {panel.label}
                                 </div>
                                 <div className="text-[0.65rem] text-gray-400 dark:text-white/35 mt-0.5">
                                    {panel.description}
                                 </div>
                              </Link>
                           </li>
                        );
                     })}
                  </ul>
               </nav>
            </aside>

            {/* Panel content */}
            <section className="flex-1 min-w-0">{children}</section>
         </div>
      </div>
   );
};

export default SettingsShell;
