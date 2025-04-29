import { GetServerSideProps, NextPage } from 'next';
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import Layout from '@/components/Layout';
import { requestConstants } from '@/constants';
import axios from 'axios';
import { parseCookies } from 'nookies';
// import { useRouter } from 'next/router';
import React, { useState } from 'react';

const optionsFilter = [
  { value: '1', label: 'approve' },
  { value: '2', label: 'decline' },
];

interface RequestDetails {
  ministryName?: string;
  requesterEmail: string;
  requesterPhone: string;
  locationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  items: Array<{
    name: string;
    quantityLeased: string;
    storeName: string;
    conditionBeforeLease: string;
  }>;
}

interface VerifyUserProps {
  requestDetails: RequestDetails;
}

export const getServerSideProps: GetServerSideProps<VerifyUserProps> = async (
  ctx
) => {
  const { id } = ctx.params || {};
  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return {
      notFound: true,
    };
  }

  const cookies = parseCookies(ctx);
  const authToken = cookies?.authToken;

  if (!authToken) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const resp = await axios.get(
      `${requestConstants.REQUEST_URI}/detail/${id}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    // console.log('response data:', resp?.data);

    return {
      props: {
        requestDetails: resp.data?.data,
      },
    };
  } catch (err: unknown) {
    return {
      props: {
        requestDetails: err || null,
      },
    };
  }
};

const RequestViewPage: NextPage<VerifyUserProps> = ({ requestDetails }) => {
  // const router = useRouter();
  // const { id } = router.query;
  const [requestStatus, setRequestStatus] = useState('');
  console.log('requestDetails:', requestDetails);

  return (
    <Layout className="grid grid-cols-12 mb-12">
      <div className="col-span-10 col-start-2 p-4 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
        <h2 className="text-xl font-semibold text-textColor mb-4">
          New Request
        </h2>

        <div className="grid grid-cols-2 gap-2 text-[#0F2552]">
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">
              church/ministry/name
            </h3>
            <p className="">{requestDetails?.ministryName}</p>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 gap-2">
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">email address</h3>
              <p className="">{requestDetails?.requesterEmail}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">phone number</h3>
              <p className="">{requestDetails?.requesterPhone}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">location</h3>
              <p className="">{requestDetails?.locationOfUse}</p>
            </div>
            <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
              <h3 className="font-semibold text-xs uppercase">return date</h3>
              <p className="">{requestDetails?.dateOfReturn}</p>
            </div>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <h3 className="font-semibold text-xs uppercase">description</h3>
            <p className="">{requestDetails?.descriptionOfRequest}</p>
          </div>
          <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
            <div className="flex items-center justify-between">
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  ITEM(s)
                </h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { name: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.name}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">STORE</h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { storeName: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.storeName}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">
                  CONDITION
                </h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { conditionBeforeLease: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.conditionBeforeLease}
                      </p>
                    )
                  )}
              </div>
              <div className="">
                <h4 className="text-xs uppercase font-semibold mb-2">QTY</h4>
                {requestDetails?.items &&
                  requestDetails?.items.map(
                    (item: { quantityLeased: string }, index: number) => (
                      <p key={index} className="text-sm leading-7">
                        {item.quantityLeased}
                      </p>
                    )
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="my-4">
          <CustomDropdownSelect
            options={optionsFilter}
            value={requestStatus}
            onChange={setRequestStatus}
            placeholder="Select status"
            noSearch
            // showSelectedLabel
          />
        </div>

        <div className="flex justify-end mt-8 mb-4">
          <button className="text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] cursor-pointer transition bg-[#B28309] rounded-[2px]">
            Submit
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default RequestViewPage;
