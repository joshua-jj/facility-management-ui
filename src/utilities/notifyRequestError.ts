import type { Dispatch, UnknownAction } from 'redux';
import { appActions } from '@/actions';

/**
 * Surface a failed request as an error snackbar instead of swallowing it.
 * 403 (insufficient permission) gets a clear capability message so an
 * empty dropdown is explained rather than mysterious.
 */
export const notifyRequestError = (
   dispatch: Dispatch<UnknownAction>,
   error: unknown,
   fallbackMessage = 'Something went wrong loading data.',
): void => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const status = (error as any)?.response?.status;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const serverMsg = (error as any)?.response?.data?.message;
   const message =
      status === 403
         ? (typeof serverMsg === 'string' && serverMsg ? serverMsg : "You don't have permission to view this data.")
         : (typeof serverMsg === 'string' && serverMsg) || fallbackMessage;
   dispatch(
      appActions.setSnackBar({ type: 'error', variant: 'error', message }) as unknown as UnknownAction,
   );
};
