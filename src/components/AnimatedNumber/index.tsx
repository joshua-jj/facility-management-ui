import React, { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
   value: number;
   duration?: number;
   delay?: number;
   className?: string;
   prefix?: string;
   suffix?: string;
   locale?: boolean;
}

function easeOutExpo(t: number): number {
   return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
   value,
   duration = 1200,
   delay = 0,
   className = '',
   prefix = '',
   suffix = '',
   locale = true,
}) => {
   const [display, setDisplay] = useState(0);
   const prevValue = useRef(0);
   const frameRef = useRef<number>(0);

   useEffect(() => {
      const from = prevValue.current;
      const to = value;
      if (from === to) return;

      let startTime: number | null = null;
      let delayTimer: ReturnType<typeof setTimeout>;

      const animate = (timestamp: number) => {
         if (!startTime) startTime = timestamp;
         const elapsed = timestamp - startTime;
         const progress = Math.min(elapsed / duration, 1);
         const eased = easeOutExpo(progress);

         const current = Math.round(from + (to - from) * eased);
         setDisplay(current);

         if (progress < 1) {
            frameRef.current = requestAnimationFrame(animate);
         } else {
            prevValue.current = to;
         }
      };

      if (delay > 0) {
         delayTimer = setTimeout(() => {
            frameRef.current = requestAnimationFrame(animate);
         }, delay);
      } else {
         frameRef.current = requestAnimationFrame(animate);
      }

      return () => {
         cancelAnimationFrame(frameRef.current);
         clearTimeout(delayTimer);
      };
   }, [value, duration, delay]);

   const formatted = locale ? display.toLocaleString() : String(display);

   return (
      <span className={className}>
         {prefix}
         {formatted}
         {suffix}
      </span>
   );
};

export default AnimatedNumber;
