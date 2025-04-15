import React, { useState } from 'react';
import { DotsIcon } from '../Icons';

type Props = {
  // row: object;
  handleUpdate: () => void;
  handleDelete: () => void;
};

const ActionDropDown = (props: Props) => {
  console.log('🚀 ~ ActionDropDown ~ props:', props);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <button onClick={() => setShowDropdown((prev) => !prev)} className="">
        <DotsIcon />
      </button>
      {showDropdown && (
        <ul className="">
          <li onClick={props.handleUpdate} className="">
            update
          </li>
          <li onClick={props.handleDelete} className="">
            delete
          </li>
        </ul>
      )}
    </>
  );
};

export default ActionDropDown;
