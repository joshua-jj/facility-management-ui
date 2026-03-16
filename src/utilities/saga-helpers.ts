import { call, put } from 'typed-redux-saga';
import { authConstants } from '@/constants';
import {
  checkStatus,
  createRequestWithToken,
  getObjectFromStorage,
  clearObjectFromStorage,
  parseResponse,
} from '@/utilities/helpers';
import { appActions } from '@/actions';
import { SetSnackBarPayload } from '@/types';

interface StoredUser {
  token: string;
  refreshToken?: string;
  user: Record<string, unknown>;
}

interface ApiError {
  response?: Response;
  message?: string;
  error?: string;
}

interface ApiResponse {
  message: string | string[];
  error?: string;
  data?: unknown;
  items?: unknown;
}

/**
 * Extract a display-friendly error message from an API response.
 * Handles both string and array message formats from NestJS validation pipes.
 */
export function extractErrorMessage(res: ApiResponse | null): string {
  if (!res) return 'Something went wrong';
  if (typeof res.message === 'string') return res.message;
  if (Array.isArray(res.message) && res.message.length > 0) return res.message[0];
  if (res.error) return res.error;
  return 'Something went wrong';
}

/**
 * Get the stored auth user and token from localForage.
 */
export function* getStoredUser() {
  const user: StoredUser | null = yield call(
    getObjectFromStorage,
    authConstants.USER_KEY
  );
  return user;
}

/**
 * Handle a 401 response by notifying the user and clearing auth state.
 * Returns true if the response was a 401.
 */
export function* handle401(response: Response): Generator<unknown, boolean, unknown> {
  if (response.status === 401) {
    // Show toast before clearing auth — so user sees the message
    const payload: SetSnackBarPayload = {
      type: 'error',
      message: 'Your session has expired. Please log in again.',
      variant: 'error',
    };
    yield put(appActions.setSnackBar(payload));

    yield call(clearObjectFromStorage, authConstants.USER_KEY);
    yield put({ type: authConstants.TOKEN_HAS_EXPIRED });
    return true;
  }

  // Handle 429 rate limit — show warning but don't log out
  if (response.status === 429) {
    const payload: SetSnackBarPayload = {
      type: 'warning',
      message: 'Too many requests. Please wait a moment and try again.',
      variant: 'warning',
    };
    yield put(appActions.setSnackBar(payload));
  }

  return false;
}

/**
 * Make an authenticated API request with automatic 401 handling.
 * Returns the parsed JSON response, or null if 401 (after dispatching expiry).
 */
export function* authenticatedRequest(
  uri: string,
  config: { method: string; body?: string },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Generator<unknown, ApiResponse | null, any> {
  const user = (yield* getStoredUser()) as StoredUser | null;

  const requestFn = () =>
    createRequestWithToken(uri, config)(user?.token as string);
  const req = (yield call(requestFn)) as Request;
  const response = (yield call(fetch, req)) as Response;

  const is401 = (yield* handle401(response)) as boolean;
  if (is401) return null;

  yield call(checkStatus, response);

  const jsonResponse = (yield call(parseResponse, response)) as ApiResponse;
  return jsonResponse;
}

/**
 * Standard error handler for saga catch blocks.
 * Dispatches the error action type and shows a snackbar.
 */
export function* handleSagaError(
  error: unknown,
  errorActionType: string,
  showSnackbar = true,
): Generator {
  const apiError = error as ApiError;

  let errorMessage = 'Something went wrong';

  if (apiError?.response) {
    const res = (yield call(
      parseResponse,
      apiError.response as Response,
    )) as ApiResponse;
    errorMessage = extractErrorMessage(res);
  } else if (apiError?.message) {
    errorMessage = apiError.message;
  } else if (apiError?.error) {
    errorMessage = apiError.error;
  }

  yield put({ type: errorActionType, error: errorMessage });

  if (showSnackbar) {
    const payload: SetSnackBarPayload = {
      type: 'error',
      message: errorMessage,
      variant: 'error',
    };
    yield put(appActions.setSnackBar(payload));
  }
}
