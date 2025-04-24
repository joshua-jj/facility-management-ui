import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  query?: string;
  allowedRoles?: number[];
};

const PrivateRoute: React.FC<LayoutProps> = ({ children, allowedRoles }) => {
  const IsAuthenticated = useSelector(
    (state: RootState) => state.auth.IsAuthenticated
  );
  const { userDetails } = useSelector((s: RootState) => s.user);

  const router = useRouter();

  if (!IsAuthenticated) {
    router.replace({
      pathname: `/login`,
      query: {
        from: encodeURIComponent(router.pathname),
      },
    });

    return null;
  }

  if (allowedRoles && !allowedRoles.includes(userDetails?.roleId)) {
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
};

export default PrivateRoute;
