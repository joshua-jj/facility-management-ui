import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/constants/permissions.enum';

export type SettingsPanelKey =
   | 'profile'
   | 'security'
   | 'access'
   | 'audit-logs'
   | 'workflows'
   | 'cron'
   | 'configuration';

type PanelEntry = {
   key: SettingsPanelKey;
   label: string;
   href: string;
   description: string;
   /**
    * Permissions to admit the panel (OR semantics). Empty array means
    * "every authenticated user" — used for Profile / Security which
    * any logged-in user must be able to reach.
    */
   permissions: readonly string[];
};

const PANELS: PanelEntry[] = [
   {
      key: 'profile',
      label: 'Profile',
      href: '/admin/settings/profile',
      description: 'Your personal details',
      permissions: [],
   },
   {
      key: 'security',
      label: 'Security',
      href: '/admin/settings/security',
      description: 'Password and account hygiene',
      permissions: [],
   },
   {
      key: 'access',
      label: 'Roles & Permissions',
      href: '/admin/settings/access',
      description: 'Manage roles and permissions',
      // Anyone who can read roles AND users belongs here. Use the
      // wider read on roles as the gate — managing roles is what this
      // panel is for, and `roles:read` lines up with that.
      permissions: [Permission.ROLES_READ],
   },
   {
      key: 'audit-logs',
      label: 'Audit Logs',
      href: '/admin/settings/audit-logs',
      description: 'Who did what, when',
      permissions: [Permission.AUDIT_LOGS_READ],
   },
   {
      key: 'workflows',
      label: 'Workflows',
      href: '/admin/settings/workflows',
      description: 'Edit state-machine rules per subject',
      // Workflows admin sits at the SUPER ADMIN tier — same gate as
      // roles management. ADMIN doesn't hold it; SA does.
      permissions: [Permission.ROLES_MANAGE],
   },
   {
      key: 'cron',
      label: 'Cron Scheduler',
      href: '/admin/settings/cron',
      description: 'Manage system cron jobs and execution schedules',
      permissions: [Permission.ROLES_MANAGE],
   },
   {
      key: 'configuration',
      label: 'Configuration',
      href: '/admin/settings/configuration',
      description: 'System-wide operational settings',
      permissions: [Permission.ROLES_MANAGE],
   },
];

type Props = {
   active: SettingsPanelKey;
   children: ReactNode;
};

const SettingsShell: React.FC<Props> = ({ active, children }) => {
   const router = useRouter();
   const { canAny } = usePermission();

   const visiblePanels = PANELS.filter(
      (p) => p.permissions.length === 0 || canAny(p.permissions),
   );

   // Defense-in-depth: if the user hit a URL whose panel they can't
   // access, bounce them to Profile. The left-rail already hides it,
   // but typed URLs shouldn't bypass gating.
   React.useEffect(() => {
      const activePanel = PANELS.find((p) => p.key === active);
      if (!activePanel) return;
      if (activePanel.permissions.length === 0) return;
      if (!canAny(activePanel.permissions)) {
         router.replace('/admin/settings/profile');
      }
   }, [active, canAny, router]);

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
