import React, { ReactNode } from 'react';
import Link from 'next/link';

interface IdentityCardProps {
  title: string;
  link: string;
  icon: ReactNode;
  filledIcon: ReactNode;
}

const IdentityCard: React.FC<IdentityCardProps> = ({
  title,
  link,
  icon,
  filledIcon,
}) => {
  return (
    <Link href={link} passHref>
      <div className="group border border-gray-200 rounded-lg bg-white shadow hover:shadow-md cursor-pointer flex flex-col justify-center items-center p-8 md:p-[88px] transition-all">
        <div className="h-11 w-11 bg-[#b2830926] rounded-full mb-4 flex items-center justify-center group-hover:bg-[#b28309] transition-colors">
          <span className="block group-hover:hidden">{icon}</span>
          <span className="hidden group-hover:block">{filledIcon}</span>
        </div>
        <p className="text-sm font-normal text-[#0f2552] uppercase">
          Identify as
        </p>
        <h3 className="mt-2 text-[15px] font-semibold text-[#0f2552]">
          {title}
        </h3>
      </div>
    </Link>
  );
};

export default IdentityCard;
