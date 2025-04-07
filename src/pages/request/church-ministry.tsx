import React, { FC } from 'react';
import Layout from '@/components/Layout';

const Church: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-8"></div>
    </Layout>
  );
};

export default Church;
