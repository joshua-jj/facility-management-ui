import { runSaga } from 'redux-saga';
import { reconciliationConstants } from '@/constants';
import { OpenReconciliationAction } from '@/actions';

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
import { openReconciliation } from '@/redux/sagas/reconciliation.saga';
import {
  authenticatedRequest,
  handleSagaError,
} from '@/utilities/saga-helpers';

// Run the saga through redux-saga, recording dispatched action types.
async function recordSaga(action: OpenReconciliationAction): Promise<string[]> {
  const dispatched: Array<{ type: string }> = [];
  await runSaga(
    {
      dispatch: (a: { type: string }) => {
        dispatched.push(a);
      },
    },
    openReconciliation,
    action,
  ).toPromise();
  return dispatched.map((a) => a.type);
}

describe('openReconciliation saga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticatedRequest as unknown as jest.Mock).mockImplementation(
      function* () {
        return mockResponse.authReturn;
      },
    );
  });

  it('requests, POSTs /reconciliation, then dispatches success', async () => {
    mockResponse.authReturn = { data: { id: 1 }, message: 'Reconciliation opened' };
    const types = await recordSaga({
      type: reconciliationConstants.OPEN_RECONCILIATION,
      data: { scopeType: 'DEPARTMENT', departmentId: 3 },
    } as OpenReconciliationAction);

    expect(types).toContain(
      reconciliationConstants.REQUEST_OPEN_RECONCILIATION,
    );
    expect(types).toContain(reconciliationConstants.OPEN_RECONCILIATION_SUCCESS);
    expect(authenticatedRequest).toHaveBeenCalledWith(
      reconciliationConstants.RECONCILIATION_URI,
      {
        method: 'POST',
        body: JSON.stringify({ scopeType: 'DEPARTMENT', departmentId: 3 }),
      },
    );
    expect(handleSagaError).not.toHaveBeenCalled();
  });

  it('returns early (no success) when the request yields null', async () => {
    mockResponse.authReturn = null;
    const types = await recordSaga({
      type: reconciliationConstants.OPEN_RECONCILIATION,
      data: { scopeType: 'CATEGORY', categoryId: 2 },
    } as OpenReconciliationAction);

    expect(types).toContain(
      reconciliationConstants.REQUEST_OPEN_RECONCILIATION,
    );
    expect(types).not.toContain(
      reconciliationConstants.OPEN_RECONCILIATION_SUCCESS,
    );
  });

  it('routes thrown errors to handleSagaError with OPEN_RECONCILIATION_ERROR', async () => {
    (authenticatedRequest as unknown as jest.Mock).mockImplementationOnce(
      function* () {
        throw new Error('boom');
      },
    );
    await recordSaga({
      type: reconciliationConstants.OPEN_RECONCILIATION,
      data: { scopeType: 'DEPARTMENT', departmentId: 9 },
    } as OpenReconciliationAction);

    expect(handleSagaError).toHaveBeenCalledWith(
      expect.any(Error),
      reconciliationConstants.OPEN_RECONCILIATION_ERROR,
    );
  });
});
