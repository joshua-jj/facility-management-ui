import React, { FC } from 'react';
import Layout from '@/components/Layout';
import TextInput from '@/components/Inputs/TextInput';
import Formsy from 'formsy-react';

const Login: FC = () => {
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-start md:justify-center items-center gap-8 md:gap-20 w-full h-full mt-12">
        <Formsy className="w-md p-8 bg-white shadow-[8px_3px_22px_0px_rgba(150, 150, 150, 0.15)] rounded">
          <h1 className="text-[#0F2552] font-bold text-[1.5rem]">Login</h1>
          <TextInput
            inputClass="text-[#0F2552]"
            type="text"
            name="email"
            label="Username/Email address"
          />
          <TextInput
            inputClass="text-[#0F2552]"
            type="password"
            name="password"
            label="Password"
          />
          <button
            className="bg-[#B28309] rounded text-center w-full py-3 mt-5 font-normal text-[0.9rem] text-white hover:bg-[#B2830998] transition cursor-pointer"
            type="submit"
          >
            Login
          </button>
        </Formsy>
      </div>
    </Layout>
  );
};

export default Login;
