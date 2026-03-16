import React, { ReactNode } from 'react';
import Link from 'next/link';

interface IdentityCardProps {
  title: string;
  link: string;
  icon: ReactNode;
  filledIcon: ReactNode;
  disabled?: boolean;
}

const IdentityCard: React.FC<IdentityCardProps> = ({
  title,
  link,
  icon,
  filledIcon,
  disabled,
}) => {
  return (
    <Link href={!disabled ? link : '#'} passHref>
      <div
        className={`group border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 shadow hover:shadow-md flex flex-col justify-center items-center p-8 md:p-[88px] transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="h-11 w-11 bg-[#b2830926] rounded-full mb-4 flex items-center justify-center group-hover:bg-[#b28309] transition-colors">
          <span className="block group-hover:hidden">{icon}</span>
          <span className="hidden group-hover:block">{filledIcon}</span>
        </div>
        <p className="text-sm font-normal text-[#0f2552] dark:text-white/60 uppercase">
          Identify as
        </p>
        <h3 className="mt-2 text-[15px] min-w-[123.58px] text-center font-semibold text-[#0f2552] dark:text-white/90">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default IdentityCard;
