import { SessionStatus } from 'src/enums';
import { AuthMiddleware } from './auth.middleware';

const USER = { id: 'u1', phoneNumber: '233241234567', role: 'User' };

function run(
  session: Record<string, any> | null,
  path: string,
  tokenId = 't1',
) {
  const sessions = {
    getByUserId: jest.fn(async () => session),
    end: jest.fn(async () => null),
  };
  const middleware = new AuthMiddleware(
    { verifyAsync: jest.fn(async () => ({ id: 'u1', tokenId })) } as any,
    { getById: jest.fn(async () => USER) } as any,
    sessions as any,
  );
  const req: any = {
    headers: { authorization: 'Bearer token' },
    originalUrl: path,
    query: {},
    body: {},
  };
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: any) {
      this.body = body;
      return this;
    },
  };
  const next = jest.fn();
  return middleware
    .use(req, res, next)
    .then(() => ({ req, res, next, sessions }));
}

describe('AuthMiddleware', () => {
  it('lets an active session through and attaches the user', async () => {
    const { req, next } = await run(
      { status: SessionStatus.Active, tokenId: 't1' },
      '/api/users/u1',
    );
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBe(USER);
  });

  it('allows the pending token only on the OTP endpoints', async () => {
    const session = { status: SessionStatus.Pending, pendingTokenId: 't1' };
    expect(
      (await run(session, '/api/authentication/verify-otp')).next,
    ).toHaveBeenCalled();
    const other = await run(session, '/api/users/u1');
    expect(other.next).not.toHaveBeenCalled();
    expect(other.res.statusCode).toBe(401);
  });

  it('explains why a token was rejected', async () => {
    const replaced = await run(
      { status: SessionStatus.Active, tokenId: 'other' },
      '/api/users/u1',
    );
    expect(replaced.res.body.reason).toBe('SESSION_REPLACED');

    const ended = await run(
      { status: SessionStatus.SignedOut, tokenId: null },
      '/api/users/u1',
    );
    expect(ended.res.body.reason).toBe('SESSION_ENDED');

    const expired = await run(
      {
        status: SessionStatus.Active,
        tokenId: 't1',
        sessionExpiresAt: new Date(Date.now() - 1000),
      },
      '/api/users/u1',
    );
    expect(expired.res.body.reason).toBe('SESSION_EXPIRED');
    expect(expired.sessions.end).toHaveBeenCalledWith(
      'u1',
      SessionStatus.Expired,
    );
  });
});
