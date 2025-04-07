import React, { FC } from 'react';
import IdentityCard from '@/components/Cards/IdentityCard';
import ProfileIcon from '../../../public/assets/icons/Profile.svg';
import ProfileBoldIcon from '../../../public/assets/icons/ProfileBold.svg';
import HomeIcon from '../../../public/assets/icons/Home.svg';
import HomeBoldIcon from '../../../public/assets/icons/HomeBold.svg';
import Layout from '@/components/Layout';

const LandingPage: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-8">
        <IdentityCard
        title="Egfm Worker"
        link="/request/egfm-worker"
          icon={<ProfileIcon />}
          filledIcon={<ProfileBoldIcon />}
        />
        <IdentityCard
          title="Church/Ministry"
          link="/request/church-ministry"
          icon={<HomeIcon />}
          filledIcon={<HomeBoldIcon />}
        />
      </div>
    </Layout>
  );
};

export default LandingPage;
