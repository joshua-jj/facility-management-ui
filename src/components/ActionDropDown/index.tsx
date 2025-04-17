import React, { useState } from 'react';
import { DotsIcon } from '../Icons';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

type Props = {
  // row: object;
  handleUpdate: () => void;
  handleDelete: () => void;
};

const ActionDropDown = (props: Props) => {
  console.log('🚀 ~ ActionDropDown ~ props:', props);
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
          className="absolute right-[2rem] bg-white z-50 py-1 shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)]"
        >
          <li
            onClick={props.handleUpdate}
            className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
          >
            update
          </li>
          <li
            onClick={props.handleDelete}
            className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs px-3 py-[0.4rem] capitalize cursor-pointer"
          >
            delete
          </li>
        </ul>
      )}
    </>
  );
};

export default ActionDropDown;
