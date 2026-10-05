// Runs before each test file: point the app at the throwaway test database.
// Real env vars win over .env files, so this overrides .env.local and .env.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/elshaddai_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
