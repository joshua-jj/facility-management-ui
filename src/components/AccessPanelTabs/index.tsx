import React, { ReactNode } from 'react';
import Link from 'next/link';
import classNames from 'classnames';

export type AccessTabKey = 'roles' | 'permissions';

type TabEntry = {
   key: AccessTabKey;
   label: string;
   href: string;
};

const TABS: TabEntry[] = [
   { key: 'roles', label: 'Roles', href: '/admin/settings/access' },
   {
      key: 'permissions',
      label: 'Permissions',
      href: '/admin/settings/access/permissions',
   },
];

type Props = {
   active: AccessTabKey;
   children: ReactNode;
};

const AccessPanelTabs: React.FC<Props> = ({ active, children }) => {
   return (
      <div>
         <div className="border-b border-gray-200 dark:border-white/10 mb-6">
            <nav className="flex gap-1" aria-label="Access panel tabs">
               {TABS.map((tab) => {
                  const isActive = tab.key === active;
                  return (
                     <Link
                        key={tab.key}
                        href={tab.href}
                        className={classNames(
                           'px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors',
                           isActive
                              ? 'border-[#B28309] text-[#B28309]'
                              : 'border-transparent text-[#0F2552]/60 dark:text-white/50 hover:text-[#0F2552] dark:hover:text-white/80',
                        )}
                     >
                        {tab.label}
                     </Link>
                  );
               })}
            </nav>
         </div>
         <div>{children}</div>
      </div>
   );
};

export default AccessPanelTabs;
