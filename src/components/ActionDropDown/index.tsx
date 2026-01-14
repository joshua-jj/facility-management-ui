import React, { useState } from 'react';
import { DotsIcon } from '../Icons';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';

type Props = {
  // row: object;
  user?: boolean;
  items?: boolean;
  log?: boolean;
  isActive?: boolean;
  handleOpen?: () => void;
  handleRole?: () => void;
  handleUpdate: () => void;
  handleDelete?: () => void;
};

const ActionDropDown = (props: Props) => {
  // console.log('🚀 ~ ActionDropDown ~ props:', props);
  const { userDetails } = useSelector((s: RootState) => s.user);

  const [showDropdown, setShowDropdown] = useState(false);

  const ref = useOnClickOutside<HTMLUListElement>(() => setShowDropdown(false));

  return (
    <>
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        className="cursor-pointer"
      >
        <DotsIcon />
      </button>
      {showDropdown && (
        <ul
          ref={ref}
          className="z-[9999] absolute right-[2rem] bg-white py-1 shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)]"
        >
          {props.items && userDetails?.roleId !== 3 && (
            <li
              onClick={props.handleOpen}
              className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
            >
              open
            </li>
          )}
          {props.user && (
            <li
              onClick={props.handleRole}
              className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
            >
              change role
            </li>
          )}
          <li
            onClick={props.handleUpdate}
            className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
          >
            update
          </li>
          {props.user ? (
            <li
              onClick={props.handleDelete}
              className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
            >
              {props.isActive ? 'deactivate' : 'activate'}
            </li>
          ) : (
            !props.log && (
              <li
                onClick={props.handleDelete}
                className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
              >
                delete
              </li>
            )
          )}
        </ul>
      )}
    </>
  );
};

export default ActionDropDown;
