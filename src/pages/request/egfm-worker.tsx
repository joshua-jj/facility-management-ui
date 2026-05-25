import React from 'react';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import RequestForm from '@/components/RequestForm';
import { useRouter } from 'next/router';
import Head from 'next/head';

const Worker: NextPageWithLayout = () => {
  const router = useRouter();
  const currentRoute = router.pathname;

  return (
    <>
      <Head>
        <title>Worker Request | EGFM - Facility Management System</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="EGFM - Facility Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/images/egfm-logo.png" />
      </Head>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-8">
        <RequestForm route={currentRoute} />
      </div>
    </>
  );
};

Worker.getLayout = (page) => <Layout>{page}</Layout>;

export default Worker;
