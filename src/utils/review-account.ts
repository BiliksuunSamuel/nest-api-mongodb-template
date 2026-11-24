/// App Store review / demo accounts: the fixed sign-in code for [phoneNumber],
/// or null when it is an ordinary account (or the feature is switched off).
/// Only exact matches on the configured numbers count, and the code must be 6
/// digits, so a typo in the setting can't open up other accounts.
export function reviewOtpFor(
  phoneNumber: string | undefined | null,
  config: { phones?: string; code?: string },
): string | null {
  const code = (config.code ?? '').trim();
  if (!/^\d{6}$/.test(code)) return null;
  // Compare digits only: numbers are stored without the "+" (233240000123)
  // while the setting is usually written as +233240000123.
  const digits = (value: string) => value.replace(/\D+/g, '');
  const phone = digits(phoneNumber ?? '');
  if (!phone) return null;
  const allowed = (config.phones ?? '').split(',').map(digits).filter(Boolean);
  return allowed.includes(phone) ? code : null;
}
