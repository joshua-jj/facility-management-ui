import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'egfm-theme';

// Shared mutable state + subscriber pattern so every useTheme() instance stays in sync
let currentTheme: Theme = 'light';
const listeners = new Set<() => void>();

function notify() {
   listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
   listeners.add(fn);
   return () => {
      listeners.delete(fn);
   };
}

function getSnapshot(): Theme {
   return currentTheme;
}

function getServerSnapshot(): Theme {
   return 'light';
}

function applyTheme(next: Theme) {
   currentTheme = next;
   localStorage.setItem(STORAGE_KEY, next);
   document.documentElement.classList.toggle('dark', next === 'dark');
   notify();
}

// Initialize once on first import (client only)
let initialized = false;
function init() {
   if (initialized || typeof window === 'undefined') return;
   initialized = true;

   const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
   if (stored === 'dark' || stored === 'light') {
      currentTheme = stored;
   } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      currentTheme = 'dark';
   }
   document.documentElement.classList.toggle('dark', currentTheme === 'dark');
}

export function useTheme() {
   // Run init on first render
   useEffect(() => {
      init();
      notify(); // trigger re-render with the initialized value
   }, []);

   const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

   const toggleTheme = useCallback(() => {
      const next = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(next);
   }, []);

   // mounted is always true after hydration since useSyncExternalStore handles SSR
   const mounted = typeof window !== 'undefined' && initialized;

   return { theme, toggleTheme, mounted };
}
