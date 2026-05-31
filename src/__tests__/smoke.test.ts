import { Permission } from '@/constants/permissions.enum';

describe('test harness', () => {
  it('runs and resolves the @/ alias', () => {
    expect(Permission.USERS_DELETE).toBe('users:delete');
  });
});
