'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
   value: number;
   delay?: number;
   duration?: number;
   suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, delay = 0, duration = 600, suffix = '' }) => {
   const [display, setDisplay] = useState(0);
   const frameRef = useRef<number>(0);

   useEffect(() => {
      const timeout = setTimeout(() => {
         const start = performance.now();
         const from = 0;
         const to = value;

         const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (to - from) * eased));

            if (progress < 1) {
               frameRef.current = requestAnimationFrame(animate);
            }
         };

         frameRef.current = requestAnimationFrame(animate);
      }, delay);

      return () => {
         clearTimeout(timeout);
         if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
   }, [value, delay, duration]);

   return (
      <>
         {display.toLocaleString()}
         {suffix}
      </>
   );
};

export default AnimatedNumber;
