import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import configuration from 'src/configuration';

/// Puts a phone number in the one form it is stored in: E.164 digits without
/// the leading "+" (e.g. "0241234567" in GH -> "233241234567"). Numbers without
/// a country code are read as [country]. Returns the input unchanged when it
/// can't be parsed, so validation can reject it.
export function normalizePhoneNumber(
  phoneNumber: string,
  country: string = configuration().defaultCountry,
): string {
  if (typeof phoneNumber !== 'string') return phoneNumber;
  const parsed = parsePhoneNumberFromString(
    phoneNumber,
    country as CountryCode,
  );
  if (!parsed || !parsed.isValid()) return phoneNumber;
  return parsed.number.replace(/^\+/, '');
}
