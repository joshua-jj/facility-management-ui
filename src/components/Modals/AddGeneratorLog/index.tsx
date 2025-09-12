import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
// import SuccessModal from '../Report/SuccessModal';
import { GeneratorForm, Item } from '@/types';
import { generatorActions, itemActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { AppEmitter } from '@/controllers/EventEmitter';
import { generatorConstants } from '@/constants';
import TextArea from '@/components/Inputs/TextArea';

interface AddItemModalProps {
  // onClose: () => void;
  children: ReactNode;
  className: string;
  // open: boolean;
}

const AddGeneratorLog: React.FC<AddItemModalProps> = ({
  className,
  children,
  // onClose,
  // open,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingGeneratorLog } = useSelector((s: RootState) => s.generator);
  // const { allRolesList } = useSelector((s: RootState) => s.role);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);
  const { departmentItemsList } = useSelector((s: RootState) => s.item);
  const { userDetails } = useSelector((s: RootState) => s.user);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  // const [roleIsOpen, setRoleIsOpen] = useState(false);
  // const [role, setRole] = useState<Role | null>(null);
  // const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  // const [department, setDepartment] = useState<Department | null>(null);
  const [itemIsOpen, setItemIsOpen] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  useEffect(() => {
    dispatch(
      itemActions.getDepartmentItems({
        departmentId: 1,
      }) as unknown as UnknownAction
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentItemsArray = departmentItemsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const handleItemSelect = (item: Item) => {
    setItem(item);
    setItemIsOpen(false);
  };

  // const allRolesArray = allRolesList?.map((obj) => ({
  //   ...obj,
  //   label: obj.name,
  //   value: obj.id.toString(),
  // }));
  // const allDepartmentsArray = allDepartmentsList?.map((obj) => ({
  //   ...obj,
  //   label: obj.name,
  //   value: obj.id.toString(),
  // }));

  // const handleRoleSelect = (role: Role) => {
  //   setRole(role);
  //   setRoleIsOpen(false);
  // };

  // const handleDepartmentSelect = (department: Department) => {
  //   setDepartment(department);
  //   setDepartmentIsOpen(false);
  // };

  console.log('allDepartmentsList', allDepartmentsList);

  const handleSubmit = (data: GeneratorForm) => {
    // data.role = role?.id as number;
    data.generatorType = String(item?.id);
    data.personnelName = userDetails?.firstName + ' ' + userDetails?.lastName;

    dispatch(
      generatorActions.createGeneratorLog(data) as unknown as UnknownAction
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      generatorConstants.CREATE_GENERATOR_LOG_SUCCESS,
      (evt: Event) => {
        const newUser = evt as CustomEvent;

        if (newUser) {
          setIsModalOpen(false);
        }
      }
    );

    return () => listener.remove();
  }, []);

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Generator log
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="nameOfMeeting"
              label="Meeting Name"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="meetingLocation"
              label="Meeting Location"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Generator used
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setItemIsOpen(!itemIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {item?.name || 'Select item'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {itemIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {departmentItemsArray.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="onTime"
              label="On Time"
              placeholder="select option"
              inputClass="font-normal border border-gray-300 rounded"
              // value={data.returnDate}
            />
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="offTime"
              label="Off Time"
              placeholder="select option"
              inputClass="font-normal border border-gray-300 rounded"
              // value={data.returnDate}
            />
            <TextInput
              type="text"
              name="engineStartHours"
              label="Engine Start Hours"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="engineOffHours"
              label="Engine Off Hours"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="dieselLevelOn"
              label="Diesel level on"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="dieselLevelOff"
              label="Diesel level off"
              placeholder="Enter name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            {/* <TextInput
              type="text"
              name="hoursUsed"
              label="Hours Used"
              placeholder="Enter hours"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            /> */}
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="lastServiceHour"
              label="Last Service Hour"
              placeholder="Enter hours"
              inputClass="font-normal border border-gray-300 rounded"
              // value={data.returnDate}
            />
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="nextServiceHour"
              label="Next Service Hour"
              placeholder="Enter hours"
              inputClass="font-normal border border-gray-300 rounded"
              // value={data.returnDate}
            />
            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Generator used
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleIsOpen(!roleIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {role?.name || 'Select role'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {roleIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {allRolesArray.map((role) => (
                        <li
                          key={role.id}
                          onClick={() => handleRoleSelect(role)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{role.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div> */}

            {/* <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Did you notice any fault?
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDepartmentIsOpen(!departmentIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {department?.name || 'Select department'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {departmentIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {allDepartmentsArray.map((department) => (
                        <li
                          key={department.id}
                          onClick={() => handleDepartmentSelect(department)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{department.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Due for service?
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDepartmentIsOpen(!departmentIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {department?.name || 'Select department'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {departmentIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {allDepartmentsArray.map((department) => (
                        <li
                          key={department.id}
                          onClick={() => handleDepartmentSelect(department)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{department.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div> */}
            <TextArea
              type="text"
              name="Remark"
              label="Remark"
              placeholder="Add details"
              required
            />
            <button
              //   onClick={handleSubmit}
              // disabled={!canSubmit() || IsCreatingRequest}
              disabled={!canSubmit}
              //   className="w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsCreatingGeneratorLog ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Submit'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
      {/* <SuccessModal
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        autoCloseDelay={5000}
      /> */}
    </>
  );
};

export default AddGeneratorLog;
