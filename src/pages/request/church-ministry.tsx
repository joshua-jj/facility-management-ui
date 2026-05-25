import React from 'react';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import RequestForm from '@/components/RequestForm';
import { useRouter } from 'next/router';

const Church: NextPageWithLayout = () => {
  const router = useRouter();
  const currentRoute = router.pathname;
  return (
    <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-8">
      <RequestForm route={currentRoute} />
    </div>
  );
};

Church.getLayout = (page) => <Layout>{page}</Layout>;

export default Church;
