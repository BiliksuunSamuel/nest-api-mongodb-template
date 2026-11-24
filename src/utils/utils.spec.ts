import { toPaginationInfo } from '.';
import { generateOtp, hashOtp, otpMatches } from './otp';
import { normalizePhoneNumber } from './phone';
import { reviewOtpFor } from './review-account';

describe('utils', () => {
  it('defaults pagination', () => {
    expect(toPaginationInfo({})).toEqual({ page: 1, pageSize: 10 });
    expect(toPaginationInfo({ page: '3', pageSize: '25' })).toEqual({
      page: 3,
      pageSize: 25,
    });
  });

  it('generates numeric codes', () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
  });

  it('hashes codes deterministically and compares in constant time', () => {
    expect(hashOtp('123456')).toBe(hashOtp(' 123456 '));
    expect(otpMatches('123456', hashOtp('123456'))).toBe(true);
    expect(otpMatches('123457', hashOtp('123456'))).toBe(false);
    expect(otpMatches('123456', null)).toBe(false);
    expect(otpMatches('123456', 'not-hex')).toBe(false);
  });

  it('normalises phone numbers to E.164 digits', () => {
    expect(normalizePhoneNumber('0241234567', 'GH')).toBe('233241234567');
    expect(normalizePhoneNumber('+233 24 123 4567', 'GH')).toBe('233241234567');
    expect(normalizePhoneNumber('+14155552671', 'GH')).toBe('14155552671');
    expect(normalizePhoneNumber('nope', 'GH')).toBe('nope');
  });

  it('matches review accounts only on exact numbers with a 6 digit code', () => {
    const config = { phones: '+233240000123, 233240000124', code: '654321' };
    expect(reviewOtpFor('233240000123', config)).toBe('654321');
    expect(reviewOtpFor('233240000124', config)).toBe('654321');
    expect(reviewOtpFor('233240000125', config)).toBeNull();
    expect(reviewOtpFor('233240000123', { ...config, code: '12' })).toBeNull();
    expect(reviewOtpFor('233240000123', {})).toBeNull();
  });
});
