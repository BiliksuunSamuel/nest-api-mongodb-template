import { OtpPolicy } from 'src/constants/otp.policy';
import { hashOtp } from 'src/utils/otp';
import { AuthService } from './auth.service';

type Session = Record<string, any>;

/// An in-memory stand-in for the session repository, with the same semantics
/// the service relies on (upsert/update merge fields, attempts counter).
function fakeSessions() {
  const store = new Map<string, Session>();
  return {
    store,
    getByUserId: jest.fn(async (id: string) => store.get(id) ?? null),
    upsert: jest.fn(async (id: string, patch: Session) => {
      const next = {
        userId: id,
        status: 'Pending',
        ...store.get(id),
        ...patch,
      };
      store.set(id, next);
      return next;
    }),
    update: jest.fn(async (id: string, patch: Session) => {
      const cur = store.get(id);
      if (!cur) return null;
      const next = { ...cur, ...patch };
      store.set(id, next);
      return next;
    }),
    end: jest.fn(async (id: string, status: string) => {
      const cur = store.get(id);
      if (!cur) return null;
      Object.assign(cur, { status, tokenId: null, pendingTokenId: null });
      return cur;
    }),
    incrementVerificationAttempts: jest.fn(async (id: string) => {
      const cur = store.get(id)!;
      cur.verificationAttempts = (cur.verificationAttempts ?? 0) + 1;
      return cur.verificationAttempts;
    }),
  };
}

const USER = {
  id: 'u1',
  phoneNumber: '233241234567',
  name: 'Ama',
  role: 'User',
};

function build() {
  const sessions = fakeSessions();
  const sms = { send: jest.fn(async () => undefined) };
  const users = {
    findOrCreateByPhoneNumber: jest.fn(async () => USER),
    getById: jest.fn(async () => USER),
  };
  const service = new AuthService(
    users as any,
    sessions as any,
    { signAsync: jest.fn(async (p: any) => `jwt:${p.tokenId}`) } as any,
    sms as any,
  );
  /// The code that was texted in the most recent SMS.
  const sentCode = (): string => {
    const calls = sms.send.mock.calls as any[];
    return /code is (\d+)/.exec(calls[calls.length - 1][1])![1];
  };
  return { service, sessions, sms, users, sentCode };
}

const login = (service: AuthService) =>
  service.login({ phoneNumber: '0241234567' });

describe('AuthService sign-in codes', () => {
  it('normalises the number, texts a code but only stores its hash', async () => {
    const { service, sessions, users, sentCode } = build();
    const res = await login(service);
    expect(res.code).toBe(200);
    expect(users.findOrCreateByPhoneNumber).toHaveBeenCalledWith(
      '233241234567',
    );

    const stored = sessions.store.get('u1')!;
    const code = sentCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(stored.verificationCodeHash).toBe(hashOtp(code));
    expect(JSON.stringify(stored)).not.toContain(code);
    expect(stored.pendingTokenId).toBeTruthy();
    expect(res.data.token).toBe(`jwt:${stored.pendingTokenId}`);
    expect(res.data.user).toBeNull();
  });

  it('does not sign out an already-active session when a code is requested', async () => {
    const { service, sessions } = build();
    sessions.store.set('u1', {
      userId: 'u1',
      status: 'Active',
      tokenId: 'live-token',
    });
    await login(service);
    const s = sessions.store.get('u1')!;
    expect(s.status).toBe('Active');
    expect(s.tokenId).toBe('live-token');
  });

  it('enforces a cooldown between codes', async () => {
    const { service } = build();
    await login(service);
    const again = await login(service);
    expect(again.code).toBe(429);
    expect(again.message).toMatch(/wait \d+s/);
  });

  it('caps the codes sent per window', async () => {
    const { service, sessions } = build();
    await login(service);
    // Cooldown passed, but the window is already full.
    sessions.store.set('u1', {
      ...sessions.store.get('u1')!,
      lastOtpSentAt: new Date(Date.now() - OtpPolicy.resendCooldownMs - 1000),
      otpSendsInWindow: OtpPolicy.maxSendsPerWindow,
      otpWindowStartedAt: new Date(),
    });
    expect((await login(service)).code).toBe(429);
  });

  it('verifies the right code and activates the session', async () => {
    const { service, sessions, sentCode } = build();
    await login(service);
    const code = sentCode();
    const res = await service.handleVerifyOtp(
      'u1',
      { verificationCode: code },
      { ipAddress: '1.2.3.4', agent: 'jest' },
    );
    expect(res.code).toBe(200);
    const s = sessions.store.get('u1')!;
    expect(s.status).toBe('Active');
    expect(s.verificationCodeHash).toBeNull();
    expect(s.pendingTokenId).toBeNull();
    expect(s.ipAddress).toBe('1.2.3.4');
    expect(res.data.token).toBe(`jwt:${s.tokenId}`);
    expect(res.data.user.phoneNumber).toBe(USER.phoneNumber);

    // A used code can't be replayed.
    const replay = await service.handleVerifyOtp('u1', {
      verificationCode: code,
    });
    expect(replay.code).not.toBe(200);
  });

  it('counts wrong guesses and then kills the code', async () => {
    const { service, sessions, sentCode } = build();
    await login(service);
    const good = sentCode();
    const bad = good === '000000' ? '111111' : '000000';

    for (let i = 1; i < OtpPolicy.maxAttempts; i++) {
      const r = await service.handleVerifyOtp('u1', { verificationCode: bad });
      expect(r.code).toBe(401);
      expect(r.message).toMatch(/attempt/);
    }
    const last = await service.handleVerifyOtp('u1', { verificationCode: bad });
    expect(last.code).toBe(429);
    expect(sessions.store.get('u1')!.verificationCodeHash).toBeNull();

    // Even the right code no longer works — a new one must be requested.
    const after = await service.handleVerifyOtp('u1', {
      verificationCode: good,
    });
    expect(after.code).not.toBe(200);
  });

  it('rejects an expired code', async () => {
    const { service, sessions, sentCode } = build();
    await login(service);
    const code = sentCode();
    sessions.store.get('u1')!.verificationCodeExpiresAt = new Date(
      Date.now() - 1000,
    );
    const res = await service.handleVerifyOtp('u1', { verificationCode: code });
    expect(res.code).toBe(401);
    expect(res.message).toMatch(/expired/);
  });

  it('resend issues a new code without rotating the temporary token', async () => {
    const { service, sessions, sms, sentCode } = build();
    await login(service);
    const pending = sessions.store.get('u1')!.pendingTokenId;

    // Cooldown first…
    expect((await service.handleResendVerificationCode('u1')).code).toBe(429);

    sessions.store.get('u1')!.lastOtpSentAt = new Date(
      Date.now() - OtpPolicy.resendCooldownMs - 1000,
    );
    const res = await service.handleResendVerificationCode('u1');
    expect(res.code).toBe(200);
    expect(sms.send).toHaveBeenCalledTimes(2);
    expect(sessions.store.get('u1')!.pendingTokenId).toBe(pending);

    const verified = await service.handleVerifyOtp('u1', {
      verificationCode: sentCode(),
    });
    expect(verified.code).toBe(200);
  });

  it('signs out by ending the session', async () => {
    const { service, sessions } = build();
    sessions.store.set('u1', { userId: 'u1', status: 'Active', tokenId: 't' });
    const res = await service.handleSignOut('u1');
    expect(res.code).toBe(200);
    expect(sessions.store.get('u1')).toMatchObject({
      status: 'SignedOut',
      tokenId: null,
    });
  });
});
