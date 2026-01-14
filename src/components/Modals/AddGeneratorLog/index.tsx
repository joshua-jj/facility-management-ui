import React, { ReactNode, useEffect, useState } from 'react';
import FullscreenModal from '../';
import CrossIcon from '../../../../public/assets/icons/Cross.svg';
import Formsy from 'formsy-react';
import TextInput from '@/components/Inputs/TextInput';
import { GeneratorForm, GeneratorLog, Item } from '@/types';
import { generatorActions, itemActions } from '@/actions';
import { UnknownAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { CaretIcon, SearchIcon } from '@/components/Icons';
import { AppEmitter } from '@/controllers/EventEmitter';
import { generatorConstants } from '@/constants';
import TextArea from '@/components/Inputs/TextArea';
import { format, parseISO } from 'date-fns';

interface AddItemModalProps {
  children?: ReactNode;
  className: string;
  generatorLog?: GeneratorLog | null;
  open?: boolean;
  onClose?: () => void;
}

const formatDateTimeLocal = (iso?: string) =>
  iso ? format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") : '';

const AddGeneratorLog: React.FC<AddItemModalProps> = ({
  className,
  children,
  generatorLog,
  open,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { IsCreatingGeneratorLog } = useSelector((s: RootState) => s.generator);
  const { departmentItemsList } = useSelector((s: RootState) => s.item);
  // const { userDetails } = useSelector((s: RootState) => s.user);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // const handleSubmit = (data: GeneratorForm) => {
  //   const base: Partial<GeneratorForm> = {
  //     generatorTypeId: item?.id || (generatorLog?.generatorTypeId as number),
  //     personnelName:
  //       `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim(),
  //   };

  //   const expectedTypes: Record<string, 'string' | 'number' | 'date'> = {
  //     onTime: 'date',
  //     offTime: 'date',
  //     lastServiceHour: 'date',
  //     nextServiceHour: 'date',
  //     dieselLevelOn: 'string',
  //     dieselLevelOff: 'string',
  //     engineStartHours: 'string',
  //     engineOffHours: 'string',
  //     hoursUsed: 'number',
  //   };

  //   const cleaned = Object.entries(data).reduce(
  //     (acc: Partial<GeneratorForm>, [key, value]) => {
  //       if (value === '' || value === null || value === undefined) return acc;

  //       const expected = expectedTypes[key];

  //       if (expected === 'date') {
  //         acc[key as keyof GeneratorForm] = new Date(
  //           String(value)
  //         ).toISOString() as any;
  //         return acc;
  //       }

  //       if (expected === 'number') {
  //         const num = Number(value);
  //         acc[key as keyof GeneratorForm] = Number.isNaN(num)
  //           ? (value as any)
  //           : (num as any);
  //         return acc;
  //       }

  //       acc[key as keyof GeneratorForm] = String(value) as any;
  //       return acc;
  //     },
  //     {}
  //   );

  //   const payload = { ...base, ...cleaned };

  //   if (generatorLog?.id) {
  //     (payload as any).id = generatorLog.id;
  //     (payload as any).generatorTypeId = generatorLog.generatorTypeId;
  //     dispatch(
  //       generatorActions.updateGeneratorLog(
  //         payload as GeneratorForm
  //       ) as unknown as UnknownAction
  //     );
  //   } else {
  //     dispatch(
  //       generatorActions.createGeneratorLog(
  //         payload as GeneratorForm
  //       ) as unknown as UnknownAction
  //     );
  //   }
  // };

  const handleSubmit = (data: GeneratorForm) => {
    const base: Partial<GeneratorForm> = {
      generatorTypeId: item?.id ?? generatorLog?.generatorTypeId,
      // personnelName:
      //   `${userDetails?.firstName ?? ''} ${userDetails?.lastName ?? ''}`.trim(),
    };

    const cleaned: Partial<GeneratorForm> = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value === '' || value === null || value === undefined) return acc;

        const typedKey = key as keyof GeneratorForm;

        if (
          typedKey === 'engineStartHours' ||
          typedKey === 'engineOffHours' ||
          typedKey === 'dieselLevelOn' ||
          typedKey === 'dieselLevelOff' ||
          typedKey === 'nameOfMeeting' ||
          typedKey === 'meetingLocation' ||
          typedKey === 'remark'
        ) {
          acc[typedKey] = value;
        } else if (typedKey === 'generatorTypeId') {
          const num = Number(value);
          if (!Number.isNaN(num)) {
            acc[typedKey] = num as GeneratorForm[typeof typedKey];
          }
        } else if (
          typedKey === 'onTime' ||
          typedKey === 'offTime' ||
          typedKey === 'lastServiceHour' ||
          typedKey === 'nextServiceHour'
        ) {
          acc[typedKey] = new Date(
            String(value)
          ).toISOString() as GeneratorForm[typeof typedKey];
        }

        return acc;
      },
      {} as Partial<GeneratorForm>
    );

    const payload: GeneratorForm = {
      ...base,
      ...cleaned,
      id: generatorLog?.id ?? undefined,
      generatorTypeId: item?.id ?? generatorLog?.generatorTypeId ?? 0,
    } as GeneratorForm;

    if (generatorLog?.id) {
      dispatch(
        generatorActions.updateGeneratorLog(payload) as unknown as UnknownAction
      );
    } else {
      dispatch(
        generatorActions.createGeneratorLog(payload) as unknown as UnknownAction
      );
    }
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

      <FullscreenModal
        open={open || isModalOpen}
        onClickAway={onClose || closeModal}
      >
        <div className="relative bg-white rounded-lg shadow-lg mx-auto p-6 w-[90vw] sm:w-[25rem] ">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <CrossIcon />
          </button>
          <h2 className="text-2xl font-semibold text-textColor mb-4">
            {generatorLog ? 'Update' : 'Create'} Generator log
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
              placeholder="Enter meeting name"
              value={generatorLog?.nameOfMeeting || ''}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="meetingLocation"
              label="Meeting Location"
              placeholder="Enter meeting location"
              value={generatorLog?.meetingLocation || ''}
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
                  {item?.name || generatorLog?.generatorType || 'Select item'}
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
              placeholder="select on time"
              value={formatDateTimeLocal(generatorLog?.onTime)}
              required
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="offTime"
              label="Off Time"
              placeholder="select off time"
              value={formatDateTimeLocal(generatorLog?.offTime)}
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="engineStartHours"
              label="Engine Start Hours"
              placeholder="Enter engine start hours"
              value={generatorLog?.engineStartHours || ''}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="engineOffHours"
              label="Engine Off Hours"
              placeholder="Enter engine off hours"
              value={generatorLog?.engineOffHours || ''}
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="dieselLevelOn"
              label="Diesel level on"
              placeholder="Enter diesel level on"
              value={(generatorLog?.dieselLevelOn ?? '').toString()}
              required
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="text"
              name="dieselLevelOff"
              label="Diesel level off"
              value={(generatorLog?.dieselLevelOff ?? '').toString()}
              placeholder="Enter diesel level off"
              className="text-[#0F2552] rounded font-medium text-sm"
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="lastServiceHour"
              label="Last Service Hour"
              placeholder="Enter last service hours"
              value={formatDateTimeLocal(generatorLog?.lastServiceHour)}
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextInput
              type="datetime-local"
              className="text-[#0F2552] rounded font-medium text-sm"
              name="nextServiceHour"
              label="Next Service Hour"
              placeholder="Enter next service hours"
              value={formatDateTimeLocal(generatorLog?.nextServiceHour)}
              inputClass="font-normal border border-gray-300 rounded"
            />
            <TextArea
              type="text"
              name="remark"
              label="Remark"
              placeholder="Add details"
              value={generatorLog?.remark || ''}
              required
            />
            <button
              disabled={!canSubmit}
              className={`w-full px-4 py-2 mt-8 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center disabled:opacity-50 ${
                canSubmit ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              {IsCreatingGeneratorLog ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : generatorLog ? (
                'Update log'
              ) : (
                'Submit'
              )}
            </button>
          </Formsy>
        </div>
      </FullscreenModal>
    </>
  );
};

export default AddGeneratorLog;
