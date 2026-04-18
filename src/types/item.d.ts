import { Store } from './store';

export interface ItemConstants {
  REQUEST_GET_DEPARTMENT_ITEMS: string;
  GET_DEPARTMENT_ITEMS_SUCCESS: string;
  GET_DEPARTMENT_ITEMS_ERROR: string;

  REQUEST_GET_ALL_DEPARTMENT_ITEMS: string;
  GET_ALL_DEPARTMENT_ITEMS_SUCCESS: string;
  GET_ALL_DEPARTMENT_ITEMS_ERROR: string;

  REQUEST_GET_ALL_ITEMS: string;
  GET_ALL_ITEMS_SUCCESS: string;
  GET_ALL_ITEMS_ERROR: string;

  REQUEST_GET_AN_ITEM: string;
  GET_AN_ITEM_SUCCESS: string;
  GET_AN_ITEM_ERROR: string;

  REQUEST_CREATE_ITEM: string;
  CREATE_ITEM_SUCCESS: string;
  CREATE_ITEMS_SUCCESS: string;
  CREATE_ITEM_ERROR: string;

  REQUEST_UPDATE_ITEM: string;
  UPDATE_ITEM_SUCCESS: string;
  UPDATE_ITEM_ERROR: string;

  REQUEST_DELETE_ITEM: string;
  DELETE_ITEM_SUCCESS: string;
  DELETE_ITEM_ERROR: string;

  REQUEST_SEARCH_ITEM: string;
  SEARCH_ITEM_SUCCESS: string;
  SEARCH_ITEM_ERROR: string;

  GET_DEPARTMENT_ITEMS: string;
  GET_ALL_DEPARTMENT_ITEMS: string;
  GET_ALL_ITEMS: string;

  GET_AN_ITEM: string;
  CREATE_ITEM: string;
  CREATE_ITEMS: string;

  UPDATE_ITEM: string;
  UPDATE_ITEM_BASIC: string;
  REQUEST_UPDATE_ITEM_BASIC: string;
  UPDATE_ITEM_BASIC_SUCCESS: string;
  UPDATE_ITEM_BASIC_ERROR: string;
  SEARCH_ITEM: string;
  DELETE_ITEM: string;

  ITEM_URI: string;
}

export interface ItemForm {
  id?: number;
  name: string;
  actualQuantity: number;
  // storeId: number;
  departmentId: number;
  fragile: boolean;
  trackingMode?: string;
  // condition: string;
}

export interface ItemUnitsForm {
  itemId: string;
  itemUnits: Array<{
    id: number;
    condition: string;
    storeId: number;
  }>;
}
export interface Item {
  fragile?: boolean;
  storeId?: number;
  storeName?: string;
  id: number;
  name: string;
  requestedQuantity?: number;
  //   itemDescription?: string;
  //   itemCategory?: string;
  status?: string | number;
  //   itemLocation: string;
  actualQuantity?: string;
  availableQuantity?: number;
  trackingMode?: string;
  condition?: string;
  department?: {
    id: number;
    name: string;
    hodName: string;
    hodEmail: string;
    hodPhone: string;
    status: string;
  };
  createdAt?: string;
  updatedAt?: string;
  itemUnits?: ItemUnit[];
}

export interface ItemUnit {
  id: number;
  serialNumber: string;
  condition: string;
  store: Store;
}

export interface ItemState {
  items: Item[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  item: Item | null;
  itemForm: ItemForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
  loadingState: LoadingState;
}
export interface ItemAction {
  type: string;
  data?: Item[];
  item?: Item;
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  itemForm?: ItemForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
  itemLogs?: Item[];
  itemLog?: Item;
  itemFormData?: ItemForm;
  itemName?: string;
  itemDescription?: string;
  itemCategory?: string;
  itemStatus?: string;
  itemQuantity?: number;
  itemLocation?: string;
  itemId?: number;
}
