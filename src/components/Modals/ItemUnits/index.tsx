import React, { useEffect, useState } from 'react';
import FullscreenModal from '..';
import Formsy from 'formsy-react';
import { ReportForm } from '@/types';
import { itemActions, reportActions } from '@/actions';
import { useDispatch, useSelector } from 'react-redux';
import { UnknownAction } from 'redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon, SearchIcon } from '@/components/Icons';

interface ItemUnitsProps {
  className?: string;
  children?: React.ReactNode;
  itemId: number;
  itemName: string;
  open: boolean;
  onClose: () => void;
}

const ItemUnits: React.FC<ItemUnitsProps> = ({
  itemId,
  itemName,
  open,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingReport } = useSelector((s: RootState) => s.report);
  const { allItemUnitsList } = useSelector((s: RootState) => s.item);

  const [canSubmit, setCanSubmit] = useState(false);
  const [unitIsOpen, setUnitIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  // const [units, setUnits] = useState<ItemUnit | null>(null);

  const enableButton = () => setCanSubmit(true);
  const disableButton = () => setCanSubmit(false);

  useEffect(() => {
    dispatch(itemActions.getAnItem({ id: itemId }) as unknown as UnknownAction);
  }, [dispatch, itemId]);

  const handleSubmit = (data: ReportForm) => {
    dispatch(reportActions.sendReport(data) as unknown as UnknownAction);
  };

  const filteredUnits = allItemUnitsList?.filter((unit) =>
    unit.serialNumber.toLowerCase().includes(search.toLowerCase())
  );

  // const handleUnitSelect = () => {
  //   // setUnits(unit);
  //   //   setUnitIsOpen(false);
  // };

  return (
    <>
      <FullscreenModal open={open} onClickAway={onClose}>
        <div className="bg-white dark:bg-[#1a1a2e] rounded-lg shadow-lg mx-auto p-6 sm:w-[400px] md:w-[500px] lg:w-[600px]">
          <h2 className="text-2xl font-semibold text-textColor dark:text-white mb-4">
            Select {itemName} Units
          </h2>
          <Formsy
            onValidSubmit={handleSubmit}
            onValid={enableButton}
            onInvalid={disableButton}
            className="space-y-4"
          >
            <div className="mb-3 group">
              <div className="flex justify-between items-center">
                <label className="block text-[0.93rem] font-medium text-[#0F2552] dark:text-white mb-1">
                  Unit
                </label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUnitIsOpen(!unitIsOpen)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/15 rounded text-left text-gray-500 dark:text-white/50"
                >
                  {'Select unit'}
                  {/* {unit?.serialNumber || 'Select unit'} */}
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[1.5rem] text-[rgba(15, 37, 82, 1)]">
                    <CaretIcon className="rotate-90" />
                  </span>
                </button>
                {unitIsOpen && (
                  <div className="absolute w-full mt-1 border border-gray-300 dark:border-white/15 rounded bg-white dark:bg-[#1a1a2e] shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] z-10 text-[#0F2552]">
                    <div className="p-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-white/50">
                          <SearchIcon />
                        </span>
                      </div>
                    </div>
                    <ul className="max-h-40 overflow-y-auto">
                      {filteredUnits.map((unit) => (
                        <li
                          key={unit.id}
                          // onClick={() => handleUnitSelect(unit)}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer flex items-center"
                        >
                          <span className="mr-4">{unit.serialNumber}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                disabled={!canSubmit}
                type="submit"
                className={`px-4 py-2 bg-yellow-600 text-white rounded-md transition hover:bg-yellow-700 ${
                  canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                {IsCreatingReport ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default ItemUnits;
