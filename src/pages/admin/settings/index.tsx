import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
   return {
      redirect: {
         destination: '/admin/settings/profile',
         permanent: false,
      },
   };
};

const SettingsIndex = () => null;

export default SettingsIndex;
