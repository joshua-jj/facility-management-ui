import React, { FC } from 'react';
import Layout from '@/components/Layout';
import RequestForm from '@/components/RequestForm';
import { useRouter } from 'next/router';

const Church: FC = () => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-8">
        <RequestForm route={currentRoute} />
      </div>
    </Layout>
  );
};

export default Church;
