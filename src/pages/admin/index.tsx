import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
   return {
      redirect: {
         destination: '/admin/dashboard',
         permanent: true,
      },
   };
};

const AdminIndex = () => null;
export default AdminIndex;
