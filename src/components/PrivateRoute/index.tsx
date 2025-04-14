import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  query?: string;
};

const PrivateRoute: React.FC<LayoutProps> = ({ children }) => {
  const IsAuthenticated = useSelector(
    (state: RootState) => state.auth.IsAuthenticated
  );

  const router = useRouter();

  if (!IsAuthenticated) {
    router.replace({
      pathname: `/admin/login`,
      query: {
        from: encodeURIComponent(router.pathname),
      },
    });

    return null;
  }

  return <>{children}</>;
};

export default PrivateRoute;
