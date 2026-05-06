import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Thin progress bar that fills the top edge of the viewport while
 * Next.js is between route-change-start and route-change-complete.
 * Sits between hot-link click and the next page's first paint — fills
 * the perceptual gap when the next page is doing data work in saga land.
 *
 * No external dependency (intentionally — nprogress would pull in jQuery
 * and a global stylesheet for a 70-byte feature).
 */
export const RouteProgress: React.FC = () => {
   const router = useRouter();
   const [active, setActive] = useState(false);
   const [progress, setProgress] = useState(0);
   const timersRef = useRef<{ tick?: number; finish?: number }>({});

   useEffect(() => {
      const clearAll = () => {
         if (timersRef.current.tick) {
            window.clearInterval(timersRef.current.tick);
            timersRef.current.tick = undefined;
         }
         if (timersRef.current.finish) {
            window.clearTimeout(timersRef.current.finish);
            timersRef.current.finish = undefined;
         }
      };

      const start = () => {
         clearAll();
         setActive(true);
         setProgress(8);
         // Ease toward 80% — never hit 100 until the route resolves so
         // the bar doesn't lie about being done.
         timersRef.current.tick = window.setInterval(() => {
            setProgress((p) => (p < 80 ? p + (80 - p) * 0.18 : p));
         }, 120);
      };

      const finish = () => {
         clearAll();
         setProgress(100);
         // Hold at 100 for a beat so the eye registers completion, then
         // fade the bar out by collapsing back to 0.
         timersRef.current.finish = window.setTimeout(() => {
            setActive(false);
            setProgress(0);
         }, 250);
      };

      router.events.on('routeChangeStart', start);
      router.events.on('routeChangeComplete', finish);
      router.events.on('routeChangeError', finish);
      return () => {
         clearAll();
         router.events.off('routeChangeStart', start);
         router.events.off('routeChangeComplete', finish);
         router.events.off('routeChangeError', finish);
      };
   }, [router.events]);

   if (!active && progress === 0) return null;

   return (
      <div
         aria-hidden
         className="fixed inset-x-0 top-0 z-[9999] h-0.5 pointer-events-none"
      >
         <div
            className="h-full bg-[var(--color-secondary)] shadow-[0_0_8px_var(--color-secondary)] transition-[width,opacity] duration-150 ease-out"
            style={{
               width: `${progress}%`,
               opacity: active ? 1 : 0,
            }}
         />
      </div>
   );
};

export default RouteProgress;
