import Head from 'next/head';
import LandingPage from './landing';

export default function Home() {
  return (
    <>
      <Head>
        <title>EGFM - Facility Management System</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="EGFM - Facility Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LandingPage />
    </>
  );
}
