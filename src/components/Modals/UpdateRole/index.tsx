import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import { Role, UpdateUserRoleForm, Users } from '@/types';
import { userActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon } from '@/components/Icons';
import { AppEmitter } from '@/controllers/EventEmitter';
import { userConstants } from '@/constants';

interface UpdateRoleModalProps {
  onClose?: () => void;
  children?: ReactNode;
  className: string;
  user?: Users | null;
  open?: boolean;
}

const UpdateRole: React.FC<UpdateRoleModalProps> = ({
  className,
  children,
  user,
  onClose,
  open,
}) => {
  const dispatch = useDispatch();
  const { IsUpdatingUserRole } = useSelector((s: RootState) => s.user);
  const { allRolesList } = useSelector((s: RootState) => s.role);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [roleIsOpen, setRoleIsOpen] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [roleError, setRoleError] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (onClose) onClose();
  }, [onClose]);

  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  const allRolesArray = allRolesList?.map((obj) => ({
    ...obj,
    label: obj.name,
    value: obj.id.toString(),
  }));

  const handleRoleSelect = (role: Role) => {
    setRole(role);
    setRoleIsOpen(false);
    setRoleError('');
  };

  const handleSubmit = (data: UpdateUserRoleForm) => {
    data.roleId = role?.id as number;
    data.userId = user?.id as number;

    dispatch(userActions.updateUserRole(data) as unknown as UnknownAction);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      userConstants.UPDATE_USER_ROLE_SUCCESS,
      (evt: Event) => {
        const newUser = evt as CustomEvent;
        console.log('newUser', newUser);
        console.log('evt', evt);

        if (newUser) {
          console.log('gothere!!!');
          closeModal();
        }
      }
    );

    return () => listener.remove();
  }, [closeModal]);

  return (
    <>
      <button className={className} onClick={openModal}>
        {children}
      </button>

      <FullscreenModal open={open || isModalOpen} onClickAway={closeModal}>
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem]">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            Update User Role
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
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
            <button
              disabled={!canSubmit}
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsUpdatingUserRole ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                'Change User Role'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default UpdateRole;
