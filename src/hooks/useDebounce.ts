import { useCallback, useRef } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback is only invoked after `delay` ms of inactivity.
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay = 400,
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay],
  ) as T;
}
