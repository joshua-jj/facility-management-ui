import React, { ReactNode } from 'react';
import Link from 'next/link';

interface IdentityCardProps {
   title: string;
   link: string;
   icon: ReactNode;
   filledIcon: ReactNode;
   disabled?: boolean;
   /**
    * 1-based index used to stagger the entrance animation. Defaults to 1.
    * The landing page passes 1 and 2 so the cards fade-up sequentially.
    */
   delayIndex?: 1 | 2 | 3 | 4 | 5 | 6;
}

const IdentityCard: React.FC<IdentityCardProps> = ({
   title,
   link,
   icon,
   filledIcon,
   disabled,
   delayIndex = 1,
}) => {
   const cardClasses = [
      'group relative overflow-hidden',
      'border border-gray-200 dark:border-white/10',
      'rounded-2xl',
      'bg-white dark:bg-white/5',
      'shadow-sm',
      'flex flex-col justify-center items-center',
      'p-8 md:p-[88px]',
      'transition-all duration-300 ease-out',
      `animate-card-delay-${delayIndex}`,
      disabled
         ? 'opacity-60 cursor-not-allowed'
         : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] hover:border-[#b28309]/60 dark:hover:border-[#b28309]/70',
   ].join(' ');

   const card = (
      <div className={cardClasses}>
         {/* Gold glow that fades in on hover. Uses pointer-events-none so it
             doesn't intercept the click target. */}
         {!disabled && (
            <div
               className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
               style={{
                  boxShadow:
                     '0 0 0 1px rgba(178,131,9,0.35), 0 24px 48px -12px rgba(178,131,9,0.35)',
               }}
            />
         )}

         {/* "Coming soon" pill on the disabled card so users understand
             *why* it's not clickable instead of just guessing. */}
         {disabled && (
            <span
               className="absolute top-4 right-4 text-[0.6rem] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
               style={{
                  background: 'rgba(178,131,9,0.12)',
                  color: '#b28309',
                  border: '1px solid rgba(178,131,9,0.35)',
               }}
            >
               Coming soon
            </span>
         )}

         {/* Icon container — both icons stack so we can crossfade smoothly
             instead of the original hard hidden/block swap. */}
         <div
            className={`relative h-12 w-12 rounded-full mb-4 flex items-center justify-center bg-[#b2830926] transition-all duration-300 ${
               disabled
                  ? ''
                  : 'group-hover:bg-[#b28309] group-hover:scale-110 group-hover:shadow-[0_0_0_8px_rgba(178,131,9,0.12)]'
            }`}
         >
            <span
               className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                  disabled ? '' : 'group-hover:opacity-0'
               }`}
            >
               {icon}
            </span>
            <span
               className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ${
                  disabled ? '' : 'group-hover:opacity-100'
               }`}
            >
               {filledIcon}
            </span>
         </div>

         <p
            className={`text-xs font-normal uppercase tracking-[0.18em] transition-colors duration-300 ${
               disabled
                  ? 'text-[#0f2552]/50 dark:text-white/40'
                  : 'text-[#0f2552]/70 dark:text-white/55 group-hover:text-[#b28309]'
            }`}
         >
            Identify as
         </p>
         <h3
            className={`mt-2 text-base min-w-[123.58px] text-center font-semibold transition-transform duration-300 ${
               disabled
                  ? 'text-[#0f2552]/70 dark:text-white/50'
                  : 'text-[#0f2552] dark:text-white/90 group-hover:scale-105'
            }`}
         >
            {title}
         </h3>
      </div>
   );

   if (disabled) {
      // Render a plain div for the disabled state so screen readers and
      // keyboard users don't see a focusable link they can't actually use.
      return <div aria-disabled="true">{card}</div>;
   }

   return (
      <Link href={link} passHref>
         {card}
      </Link>
   );
};

export default IdentityCard;
