import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

import DeleteUserModal from './index';
import { userConstants } from '@/constants';

describe('DeleteUserModal', () => {
  beforeEach(() => mockDispatch.mockClear());

  it('shows the user name and dispatches deleteUser on confirm, then closes', async () => {
    const onClose = jest.fn();
    render(
      <DeleteUserModal
        className="hidden"
        open
        userId={42}
        userName="Ada Lovelace"
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: userConstants.DELETE_USER,
        data: { id: 42 },
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('cancel closes without dispatching', async () => {
    const onClose = jest.fn();
    render(
      <DeleteUserModal className="hidden" open userId={1} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
