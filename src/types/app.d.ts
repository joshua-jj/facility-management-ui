export interface Environment {
    baseUrl: string | undefined;
  }
  
  export interface AppConstants {
    BASE_URI: string | undefined;
  
    KEY_PREFIX: string;

    CLEAR_MESSAGES: string;
    SET_SNACKBAR: string;
    CLEAR_SNACKBAR: string;

  }
  
  export interface SetSnackBarPayload {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }

export interface Action {
  id?: number;
  data?: unknown;
  user?: unknown;
  message?: unknown;
  type: string;
  error?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  // Add other pagination properties as needed
}

export type LoadingState = boolean;
export type PaginationState = Pagination | null;
