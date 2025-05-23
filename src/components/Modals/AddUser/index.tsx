import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { CreateUserForm, Department, Role, Users } from '@/types';
import { userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { AppEmitter } from '@/controllers/EventEmitter';
import { userConstants } from '@/constants';

interface AddItemModalProps {
  onClose?: () => void;
  children?: ReactNode;
  className: string;
  user?: Users | null;
  open?: boolean;
}

const AddUser: React.FC<AddItemModalProps> = ({
  className,
  children,
  user,
  onClose,
  open,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingUser } = useSelector((s: RootState) => s.user);
  const { allRolesList } = useSelector((s: RootState) => s.role);
  const { allDepartmentsList } = useSelector((s: RootState) => s.department);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [roleIsOpen, setRoleIsOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [departmentIsOpen, setDepartmentIsOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [search, setSearch] = useState('');
  const [roleError, setRoleError] = useState('');
  const [departmentError, setDepartmentError] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    if (onClose) onClose();
  };
  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const allRolesArray = allRolesList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));
  const allDepartmentsArray = allDepartmentsList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const handleRoleSelect = (role: Role) => {
    setRole(role);
    setRoleIsOpen(false);
    setRoleError('');
  };

  const handleDepartmentSelect = (department: Department) => {
    setDepartment(department);
    setDepartmentIsOpen(false);
    setDepartmentError('');
  };

  const filteredDepartments = allDepartmentsArray.filter((department) =>
    department.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data: CreateUserForm) => {
    if (!role) {
      setRoleError('Please select a role.');
      return;
    }
    if (role.id === 3 && !department) {
      setDepartmentError('Please select a department for this role.');
      return;
    }
    data.role = role?.id as number;
    data.departmentId = Number(department?.id);

    dispatch(
      user
        ? (userActions.createUser(data) as unknown as UnknownAction)
        : (userActions.createUser(data) as unknown as UnknownAction)
    );
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      userConstants.CREATE_USER_SUCCESS,
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

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            {user ? 'Update' : 'Create'} User
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <TextInput
              type="text"
              name="firstName"
              label="First Name"
              value={user?.firstName}
              placeholder="Enter first name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="lastName"
              label="Last Name"
              value={user?.lastName}
              placeholder="Enter last name"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="email"
              label="Email"
              value={user?.email}
              placeholder="Enter email address"
              validations="isEmail"
              validationError="This is not a valid email"
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="phoneNumber"
              label="Phone number"
              value={user?.phoneNumber}
              placeholder="Enter phone number"
              validations="isValidPhone"
              validationError="Please enter a valid phone number."
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                  Role
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleIsOpen(!roleIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded text-left text-gray-500"
                >
                  {role?.name || String(user?.role) || 'Select role'}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {roleIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 rounded bg-white shadow-lg z-10 text-[#0F2552]">
                    {/* <div className="p-2">
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
                    </div> */}
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
              <p className="text-red-500 text-sm">{roleError}</p>
            </div>
            {role?.id === 3 && (
              <div className="mb-3 group">
                <div className="flex justify-between items-center">
                  <label className="block text-[0.93rem] font-medium text-[#0F2552] mb-1">
                    Department
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
                        {filteredDepartments.map((department) => (
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
                <p className="text-red-500 text-sm">{departmentError}</p>
              </div>
            )}
            <button
              // disabled={!canSubmit() || IsCreatingRequest}
              disabled={!canSubmit}
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsCreatingUser ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                'Update User'
              ) : (
                'Add New User'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default AddUser;
