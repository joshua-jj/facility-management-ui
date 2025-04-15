export interface StoreConstants {
  REQUEST_GET_STORES: string;
  GET_STORES_SUCCESS: string;
  GET_STORES_ERROR: string;

  REQUEST_SEARCH_STORE: string;
  SEARCH_STORE_SUCCESS: string;
  SEARCH_STORE_ERROR: string;

  GET_STORES: string;
  SEARCH_STORE: string;

  STORE_URI: string;
}

export interface StoreForm {
  storeName: string;
  storeLocation: string;
  storeDescription: string;
  storeType: string;
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
