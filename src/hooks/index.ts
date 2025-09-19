import { useRouter } from 'next/router';

export function useMatch(path: string): boolean {
  const { pathname } = useRouter();
  return pathname === path;
}

export const getValidString = (input: string | null | undefined): string => {
  return input ?? ''; // Returns input if it's not null or undefined, otherwise returns an empty string
};

export const useIsAuthRoute = () => {
  const { pathname } = useRouter();

  const routes = [
    '/',
    '/landing',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/change-password',
    '/verify-user/[email]',
  ];

  const checker = (route: string) => routes.indexOf(route) !== -1;

  return checker(pathname);
};
