import * as dotenv from 'dotenv';

dotenv.config();

const config = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  connectionString: process.env.CONNECTION_STRING,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  appName: process.env.APP_NAME || 'App',

  // Lifetime of issued JWTs (vercel/ms format: '365d', '12h', ...). A token is
  // only honoured while its session is still Active, so this is an upper bound.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '365d',

  // How long a verified session lasts, in days. Unset = it does not expire on
  // its own (it ends only on sign-out or when another device signs in).
  sessionLifetimeDays: process.env.SESSION_LIFETIME_DAYS
    ? parseInt(process.env.SESSION_LIFETIME_DAYS, 10)
    : null,

  // ISO country used to parse phone numbers written without a country code.
  defaultCountry: (process.env.DEFAULT_COUNTRY || 'GH').toUpperCase(),

  // Express "trust proxy" setting. Set it (e.g. 1) when running behind a
  // reverse proxy so the real client IP is used for throttling and sessions.
  // Leave unset otherwise: trusting a proxy that isn't there lets clients spoof
  // their IP through X-Forwarded-For.
  trustProxy: process.env.TRUST_PROXY
    ? isNaN(Number(process.env.TRUST_PROXY))
      ? process.env.TRUST_PROXY
      : Number(process.env.TRUST_PROXY)
    : false,

  // App Store review / demo accounts. Reviewers can't receive a text message, so
  // these specific phone numbers sign in with a fixed code and no SMS is sent.
  // REVIEW_PHONES is a comma-separated list of numbers; REVIEW_OTP_CODE is the 6
  // digit code. Unset either to switch it off.
  reviewAccounts: {
    phones: process.env.REVIEW_PHONES,
    code: process.env.REVIEW_OTP_CODE,
  },

  isProduction: process.env.NODE_ENV === 'production',
});

// fail fast with a clear message instead of an obscure runtime error
for (const key of ['CONNECTION_STRING', 'JWT_SECRET']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default config;
