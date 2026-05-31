import { runSaga } from 'redux-saga';
import { userConstants } from '@/constants';
import { DeleteUserAction } from '@/actions';

// Prefixed `mock` so jest allows it inside the hoisted jest.mock factory.
const mockResponse = { authReturn: undefined as unknown };
jest.mock('@/utilities/saga-helpers', () => ({
  authenticatedRequest: jest.fn(function* () {
    return mockResponse.authReturn;
  }),
  handleSagaError: jest.fn(function* () {
    /* no-op */
  }),
}));

// Import AFTER the mock so the saga binds to the mocked helpers.
import { deleteUser } from '@/redux/sagas/user.saga';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

// Run the saga through redux-saga, recording dispatched action types.
async function recordSaga(action: DeleteUserAction): Promise<string[]> {
  const dispatched: Array<{ type: string }> = [];
  await runSaga(
    {
      dispatch: (a: { type: string }) => {
        dispatched.push(a);
      },
    },
    deleteUser,
    action,
  ).toPromise();
  return dispatched.map((a) => a.type);
}

describe('deleteUser saga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatedRequest as unknown as jest.Mock).mockImplementation(
      function* () {
        return mockResponse.authReturn;
      },
    );
  });

  it('requests, calls DELETE /user/:id, then dispatches success', async () => {
    mockResponse.authReturn = { message: 'User deleted successfully' };
    const types = await recordSaga({
      type: userConstants.DELETE_USER,
      data: { id: 7 },
    } as DeleteUserAction);
    expect(types).toContain(userConstants.REQUEST_DELETE_USER);
    expect(types).toContain(userConstants.DELETE_USER_SUCCESS);
    expect(authenticatedRequest).toHaveBeenCalledWith(
      `${userConstants.USER_URI}/7`,
      { method: 'DELETE' },
    );
    expect(handleSagaError).not.toHaveBeenCalled();
  });

  it('returns early (no success) when the request yields null', async () => {
    mockResponse.authReturn = null;
    const types = await recordSaga({
      type: userConstants.DELETE_USER,
      data: { id: 5 },
    } as DeleteUserAction);
    expect(types).toContain(userConstants.REQUEST_DELETE_USER);
    expect(types).not.toContain(userConstants.DELETE_USER_SUCCESS);
  });

  it('routes thrown errors to handleSagaError with DELETE_USER_ERROR', async () => {
    (authenticatedRequest as unknown as jest.Mock).mockImplementationOnce(
      function* () {
        throw new Error('boom');
      },
    );
    await recordSaga({
      type: userConstants.DELETE_USER,
      data: { id: 9 },
    } as DeleteUserAction);
    expect(handleSagaError).toHaveBeenCalledWith(
      expect.any(Error),
      userConstants.DELETE_USER_ERROR,
    );
  });
});
