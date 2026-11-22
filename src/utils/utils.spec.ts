import { comparePassword, hashPassword, toPaginationInfo } from '.';

describe('utils', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('Str0ng!Pass');
    expect(hash).not.toBe('Str0ng!Pass');
    expect(await comparePassword('Str0ng!Pass', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });

  it('defaults pagination', () => {
    expect(toPaginationInfo({})).toEqual({ page: 1, pageSize: 10 });
    expect(toPaginationInfo({ page: '3', pageSize: '25' })).toEqual({
      page: 3,
      pageSize: 25,
    });
  });
});
