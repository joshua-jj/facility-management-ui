import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

interface AuthLayoutProps {
   title: string;
   heading: string;
   subtitle?: string;
   children: React.ReactNode;
   footer?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, heading, subtitle, children, footer }) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';

   return (
      <>
         <Head>
            <title>{title}</title>
            <meta charSet="UTF-8" />
            <meta name="description" content="EGFM - Facility Management System" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
         </Head>

         <div
            className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0e0e1a]' : 'bg-[#fafafa]'}`}
         >
            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
               <div
                  className="absolute rounded-full"
                  style={{
                     top: '-25%',
                     right: '-15%',
                     width: '60vw',
                     height: '60vw',
                     background: `radial-gradient(circle, rgba(15,37,82,${isDark ? '0.12' : '0.04'}) 0%, transparent 65%)`,
                     filter: 'blur(40px)',
                  }}
               />
               <div
                  className="absolute rounded-full"
                  style={{
                     bottom: '-30%',
                     left: '-20%',
                     width: '70vw',
                     height: '70vw',
                     background: `radial-gradient(circle, rgba(178,131,9,${isDark ? '0.08' : '0.04'}) 0%, transparent 60%)`,
                     filter: 'blur(40px)',
                  }}
               />
            </div>

            {/* Theme toggle */}
            <ThemeToggle className="fixed top-6 right-6 z-20" />

            {/* Logo */}
            <div className="animate-fade-in-scale mb-8 flex flex-col items-center z-10">
               <Image
                  src="/assets/images/egfm-logo.png"
                  alt="EGFM Logo"
                  width={72}
                  height={72}
                  unoptimized
                  className={isDark ? 'brightness-125 saturate-[0.9]' : ''}
               />
               <span
                  className={`mt-2 text-sm font-semibold tracking-[0.12em] uppercase transition-colors ${isDark ? 'text-white/80' : 'text-[#0F2552]'}`}
               >
                  Logistics
               </span>
            </div>

            {/* Content */}
            <div className="w-full max-w-[420px] mx-auto px-4 z-10">
               <div className="animate-fade-up">
                  <h1
                     className={`font-extrabold text-2xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F2552]'}`}
                  >
                     {heading}
                  </h1>
                  {subtitle && (
                     <p
                        className={`text-sm mt-1 mb-8 transition-colors ${isDark ? 'text-white/40' : 'text-[#0F2552]/60'}`}
                     >
                        {subtitle}
                     </p>
                  )}
               </div>

               {children}

               {footer && (
                  <div className="mt-6 text-center">
                     {footer}
                  </div>
               )}
            </div>

            {/* Footer copyright */}
            <p
               className={`animate-fade-up-delay-5 mt-10 text-xs z-10 transition-colors ${isDark ? 'text-white/20' : 'text-[#0F2552]/30'}`}
            >
               &copy; {new Date().getFullYear()} EGFM Logistics. All rights reserved.
            </p>
         </div>
      </>
   );
};

export default AuthLayout;
