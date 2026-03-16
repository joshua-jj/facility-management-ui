export interface StoreConstants {
  REQUEST_GET_STORES: string;
  GET_STORES_SUCCESS: string;
  GET_STORES_ERROR: string;

  REQUEST_SEARCH_STORE: string;
  SEARCH_STORE_SUCCESS: string;
  SEARCH_STORE_ERROR: string;

  REQUEST_CREATE_STORE: string;
  CREATE_STORE_SUCCESS: string;
  CREATE_STORE_ERROR: string;

  REQUEST_UPDATE_STORE: string;
  UPDATE_STORE_SUCCESS: string;
  UPDATE_STORE_ERROR: string;

  GET_STORES: string;
  SEARCH_STORE: string;
  CREATE_STORE: string;

  UPDATE_STORE: string;

  ACTIVATE_STORE: string;
  REQUEST_ACTIVATE_STORE: string;
  ACTIVATE_STORE_SUCCESS: string;
  ACTIVATE_STORE_ERROR: string;

  DEACTIVATE_STORE: string;
  REQUEST_DEACTIVATE_STORE: string;
  DEACTIVATE_STORE_SUCCESS: string;
  DEACTIVATE_STORE_ERROR: string;

  STORE_URI: string;
}

export interface StoreForm {
  name: string;
  location: {
    houseAddress: string;
    country: string;
    state: string;
  };
  id?: number;
  // storeDescription: string;
  // storeType: string;
}

export interface Store {
  id: number;
  name: string;
  location: {
    houseAddress: string;
    country: string;
    state: string;
  };
  createdAt: string;
  updatedAt: string;
  status: number;
  //   storeLocation: string;
  //   storeDescription: string;
  //   storeType: string;
}
export interface StoreState {
  stores: Store[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string | null;
  store: Store | null;
  storeForm: StoreForm;
  pagination: PaginationState;
  loadingState: LoadingState;
  paginationState: PaginationState;
}
export interface StoreAction {
  type: string;
  stores?: Store[];
  store?: Store[];
  message?: string;
  error?: string;
  loading?: boolean;
  success?: boolean;
  storeForm?: StoreForm;
  pagination?: PaginationState;
  loadingState?: LoadingState;
  paginationState?: PaginationState;
}
