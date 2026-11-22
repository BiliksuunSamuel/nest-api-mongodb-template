import * as dotenv from 'dotenv';

dotenv.config();

const config = () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  connectionString: process.env.CONNECTION_STRING,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
});

// fail fast with a clear message instead of an obscure runtime error
for (const key of ['CONNECTION_STRING', 'JWT_SECRET']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default config;
