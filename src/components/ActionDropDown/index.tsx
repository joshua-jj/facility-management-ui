import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

type DropdownPosition = {
  top?: number;
  bottom?: number;
  right: number;
};

const ActionDropDown = (props: Props) => {
  // console.log('🚀 ~ ActionDropDown ~ props:', props);
  const { userDetails } = useSelector((s: RootState) => s.user);

  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const ref = useOnClickOutside<HTMLUListElement>(() => setShowDropdown(false));

  const handleToggleDropdown = useCallback(() => {
    if (!showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const dropdownHeight = 150; // approximate max height of dropdown

      // Right-anchoring at the button can push the menu's left edge
      // off-screen on narrow phones. Cap `right` so the menu (min-w 120)
      // stays within the viewport with an 8px gutter.
      const DROPDOWN_MIN_WIDTH = 120;
      const GUTTER = 8;
      const maxRight = Math.max(
        0,
        window.innerWidth - DROPDOWN_MIN_WIDTH - GUTTER,
      );
      const desiredRight = window.innerWidth - buttonRect.right;
      const newPosition: DropdownPosition = {
        right: Math.min(Math.max(0, desiredRight), maxRight),
      };

      if (spaceBelow < dropdownHeight) {
        // Open upward
        newPosition.bottom = window.innerHeight - buttonRect.top + 4;
      } else {
        // Open downward
        newPosition.top = buttonRect.bottom + 4;
      }

      setPosition(newPosition);
    }
    setShowDropdown((prev) => !prev);
  }, [showDropdown]);

  const dropdownMenu = showDropdown && (
    <ul
      ref={ref}
      style={{
        position: 'fixed',
        top: position.top,
        bottom: position.bottom,
        right: position.right,
      }}
      className="z-[9999] bg-white py-1 shadow-[16px_0px_32px_0px_rgba(150,150,150,0.15)] border-[0.5px] border-[rgba(15,37,82,0.15)] min-w-[120px] rounded animate-dropdown-enter"
    >
      {props.items && userDetails?.roleId !== 3 && (
        <li
          onClick={() => {
            props.handleOpen?.();
            setShowDropdown(false);
          }}
          className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs text-gray-800 px-3 py-[0.4rem] capitalize cursor-pointer"
        >
          open
        </li>
      )}
      {props.user && (
        <li
          onClick={() => {
            props.handleRole?.();
            setShowDropdown(false);
          }}
          className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs text-gray-800 px-3 py-[0.4rem] capitalize cursor-pointer"
        >
          change role
        </li>
      )}
      <li
        onClick={() => {
          props.handleUpdate();
          setShowDropdown(false);
        }}
        className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs text-gray-800 px-3 py-[0.4rem] capitalize cursor-pointer"
      >
        update
      </li>
      {props.user ? (
        <li
          onClick={() => {
            props.handleDelete?.();
            setShowDropdown(false);
          }}
          className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs text-gray-800 px-3 py-[0.4rem] capitalize cursor-pointer"
        >
          {props.isActive ? 'deactivate' : 'activate'}
        </li>
      ) : (
        !props.log && (
          <li
            onClick={() => {
              props.handleDelete?.();
              setShowDropdown(false);
            }}
            className="bg-transparent hover:bg-[#E5E8EC] transition rounded-[3px] text-xs text-gray-800 px-3 py-[0.4rem] capitalize cursor-pointer"
          >
            delete
          </li>
        )
      )}
    </ul>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="cursor-pointer"
      >
        <DotsIcon />
      </button>
      {showDropdown && createPortal(dropdownMenu, document.body)}
    </>
  );
};

export default ActionDropDown;
