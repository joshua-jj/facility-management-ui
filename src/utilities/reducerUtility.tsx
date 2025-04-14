interface ObjectType {
  [key: string]: unknown;
}

export const updateObject = <T extends ObjectType>(
  oldObject: T,
  newValues: T
): T => {
  return Object.assign({}, oldObject, newValues) as T;
};

export const updateItemInArray = <T extends ObjectType>(
  array: T[],
  itemId: string,
  isUuid: boolean = false,
  updateItemCallback: (item: T) => T
): T[] => {
  const updatedItems = array.map((item: T) => {
    const shouldUpdate = isUuid ? item.uuid === itemId : item.id === itemId;

    if (!shouldUpdate) {
      return item;
    }

    return updateItemCallback(item);
  });
  return updatedItems;
};

export const updateObjectInArray = <T extends ObjectType>(
  array: T[],
  action: { index: number; item: T }
): T[] => {
  return array.map((item: T, index: number) => {
    if (index !== action.index) {
      return item;
    }

    return { ...item, ...action.item };
  });
};
