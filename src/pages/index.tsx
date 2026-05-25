import Head from 'next/head';
import Layout from '@/components/Layout';
import type { NextPageWithLayout } from '@/types/next-page-with-layout';
import LandingPage from './landing';

const Home: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>EGFM - Facility Management System</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="EGFM - Facility Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/assets/images/egfm-logo.png" />
      </Head>
      <LandingPage />
    </>
  );
};

Home.getLayout = (page) => <Layout>{page}</Layout>;

export default Home;
