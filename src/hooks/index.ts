import { useRouter } from 'next/router';

export function useMatch(path: string): boolean {
  const { pathname } = useRouter();
  return pathname === path;
}

export const useAdminRoute = (): number => {
  const { asPath } = useRouter();

  const dashbaord = asPath === '/studio/dashbaord';
  const requests = asPath === '/studio/requests';
  const items = asPath === '/studio/items';
  const store = asPath === '/studio/store';
  const departments = asPath === '/studio/departments';
  const maintenance = asPath === '/studio/maintenance-logs';

  if (dashbaord) {
    return 1;
  } else if (requests) {
    return 3;
  } else if (items) {
    return 4;
  } else if (store) {
    return 5;
  } else if (departments) {
    return 6;
  } else if (maintenance) {
    return 7;
  } else {
    return 8;
  }
};

export const getValidString = (input: string | null | undefined): string => {
  return input ?? ''; // Returns input if it's not null or undefined, otherwise returns an empty string
};
