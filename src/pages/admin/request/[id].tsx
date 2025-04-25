/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomDropdownSelect from '@/components/CustomDropdownSelect';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

const optionsFilter = [
  { value: '1', label: 'collected' },
  { value: '2', label: 'returned' },
];

const RequestViewPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const [requestStatus, setRequestStatus] = useState('');

    return (
        <Layout className='grid grid-cols-12 mb-12'>
            <div className="col-span-10 col-start-2 p-4 bg-white rounded border-[0.5px] border-[rgba(15,37,82,0.1)] shadow-[8px_3px_22px_10px_rgba(150,150,150,0.11)]">
                <h2 className="text-xl font-semibold text-textColor mb-4">
                    New Request
                </h2>

                <div className="grid grid-cols-2 gap-2 text-[#0F2552]">
                    <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                        <h3 className="font-semibold text-xs uppercase">church/ministry/name</h3>
                        <p className="">leo king</p>
                    </div>
                    <div className="grid grid-cols-subgrid col-span-2 gap-2">
                        <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                            <h3 className="font-semibold text-xs uppercase">email address</h3>
                            <p className="">leo@gmail.com</p>
                        </div>
                        <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                            <h3 className="font-semibold text-xs uppercase">phone number</h3>
                            <p className="">726-556-3962</p>
                        </div>
                        <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                            <h3 className="font-semibold text-xs uppercase">location</h3>
                            <p className="">64920 Emmanuelle Summit</p>
                        </div>
                        <div className="col-span-1 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                            <h3 className="font-semibold text-xs uppercase">return date</h3>
                            <p className="">10/02/24</p>
                        </div>
                    </div>
                    <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                        <h3 className="font-semibold text-xs uppercase">description</h3>
                        <p className="">Sapiente quia eveniet ea quaerat at. Quia enim aut non. Voluptates nihil esse. Et numquam exercitationem. Ea esse dicta reiciendis at qui facilis.</p>
                    </div>
                    <div className="col-span-2 bg-[#EFF2F6] p-4 text-sm rounded-[2px]">
                        <div className="flex items-center justify-between">
                            <div className="">
                                <h4 className="text-xs uppercase font-semibold mb-2">ITEM(s)</h4>
                                <p className="text-sm leading-7">Nikon Z6ii quantity</p>
                                <p className="text-sm leading-7">Nikon Z6ii quantity</p>
                                <p className="text-sm leading-7">Nikon Z6ii quantity</p>
                                <p className="text-sm leading-7">Nikon Z6ii quantity</p>
                            </div>
                            <div className="">
                                <h4 className="text-xs uppercase font-semibold mb-2">QTY</h4>
                                <p className="text-sm leading-7">10</p>
                                <p className="text-sm leading-7">10</p>
                                <p className="text-sm leading-7">10</p>
                                <p className="text-sm leading-7">10</p>
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
                    <button className="text-xs text-[#fff] px-5 py-3 hover:bg-[#B2830998] cursor-pointer transition bg-[#B28309] rounded-[2px]">Submit</button>
                </div>
            </div>
        </Layout>
    );
;}

export default RequestViewPage;
