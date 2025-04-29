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

  REQUEST_SEARCH_ITEM: string;
  SEARCH_ITEM_SUCCESS: string;
  SEARCH_ITEM_ERROR: string;

  GET_DEPARTMENT_ITEMS: string;
  GET_ALL_DEPARTMENT_ITEMS: string;
  GET_ALL_ITEMS: string;
  SEARCH_ITEM: string;

  ITEM_URI: string;
}

export interface ItemForm {
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  itemStatus: string;
  itemQuantity: number;
  itemLocation: string;
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
