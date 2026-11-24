// Jest: required env for modules that read configuration at import time.
process.env.CONNECTION_STRING ??= 'mongodb://localhost:27017/test';
process.env.JWT_SECRET ??= 'test-secret';
process.env.DEFAULT_COUNTRY ??= 'GH';
