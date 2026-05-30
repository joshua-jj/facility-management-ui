import { userConstants } from '@/constants';

// Must be prefixed `mock` so jest allows it inside the hoisted jest.mock factory.
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

// Drain a saga generator, collecting the action types of any PUT effects.
function drainPutTypes(gen: Generator): string[] {
  const types: string[] = [];
  let step = gen.next();
  while (!step.done) {
    const eff = step.value as {
      type?: string;
      payload?: { action?: { type?: string } };
    };
    if (eff?.type === 'PUT' && eff.payload?.action?.type) {
      types.push(eff.payload.action.type);
    }
    step = gen.next();
  }
  return types;
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

  it('requests, calls DELETE /user/:id, then dispatches success', () => {
    mockResponse.authReturn = { message: 'User deleted successfully' };
    const types = drainPutTypes(
      deleteUser({ type: userConstants.DELETE_USER, data: { id: 7 } } as never),
    );
    expect(types).toContain(userConstants.REQUEST_DELETE_USER);
    expect(types).toContain(userConstants.DELETE_USER_SUCCESS);
    expect(authenticatedRequest).toHaveBeenCalledWith(
      `${userConstants.USER_URI}/7`,
      { method: 'DELETE' },
    );
    expect(handleSagaError).not.toHaveBeenCalled();
  });

  it('returns early (no success) when the request yields null', () => {
    mockResponse.authReturn = null;
    const types = drainPutTypes(
      deleteUser({ type: userConstants.DELETE_USER, data: { id: 5 } } as never),
    );
    expect(types).toContain(userConstants.REQUEST_DELETE_USER);
    expect(types).not.toContain(userConstants.DELETE_USER_SUCCESS);
  });

  it('routes thrown errors to handleSagaError with DELETE_USER_ERROR', () => {
    (authenticatedRequest as unknown as jest.Mock).mockImplementationOnce(
      function* () {
        throw new Error('boom');
      },
    );
    drainPutTypes(
      deleteUser({ type: userConstants.DELETE_USER, data: { id: 9 } } as never),
    );
    expect(handleSagaError).toHaveBeenCalledWith(
      expect.any(Error),
      userConstants.DELETE_USER_ERROR,
    );
  });
});
