import { runSaga } from 'redux-saga';
import { authConstants } from '@/constants';
import { LoginAction } from '@/actions/authentication.action';

// The login saga only pulls createRequest from helpers before the network
// call; stub the module so we don't need a real Request/fetch environment.
jest.mock('@/utilities/helpers', () => ({
  createRequest: jest.fn(() => ({})),
  checkStatus: jest.fn(),
  parseResponse: jest.fn(),
  setObjectInStorage: jest.fn(),
  clearObjectFromStorage: jest.fn(),
  createRequestWithToken: jest.fn(),
  getObjectFromStorage: jest.fn(),
}));

// Spy on the shared error handler — its job (dispatching LOGIN_FAILURE) is
// covered elsewhere; here we only assert the saga routes a stuck request to it.
jest.mock('@/utilities/saga-helpers', () => ({
  handleSagaError: jest.fn(function* () {
    /* no-op */
  }),
}));

import { login } from '@/redux/sagas/authentication.saga';
import { handleSagaError } from '@/utilities/saga-helpers';

const action = {
  type: authConstants.LOGIN,
  data: { email: 'a@b.com', password: 'x' },
} as unknown as LoginAction;

describe('login saga — timeout belt-and-suspenders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('does not hang forever: a stuck request loses the race and is routed to LOGIN_FAILURE', async () => {
    // fetch never resolves — simulates a cold-start / hung API.
    (global as unknown as { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockReturnValue(new Promise(() => undefined));

    const dispatched: Array<{ type: string }> = [];
    const task = runSaga(
      { dispatch: (a: { type: string }) => dispatched.push(a) },
      login,
      action,
    );

    // Let the saga reach the race, then trip the timeout.
    await Promise.resolve();
    jest.advanceTimersByTime(25_000);
    await task.toPromise();

    // The submit flag was set on entry…
    expect(dispatched.map((a) => a.type)).toContain(authConstants.LOGGING_IN);
    // …and the hung request was funnelled to the failure handler (which
    // resets IsLoggingIn) instead of leaving the button spinning forever.
    expect(handleSagaError).toHaveBeenCalledWith(
      expect.any(Error),
      authConstants.LOGIN_FAILURE,
    );
  });
});
