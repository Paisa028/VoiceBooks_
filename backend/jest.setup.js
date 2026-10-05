// Jest setup file
process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters';
process.env.JWT_EXPIRES_IN = '1d';
process.env.RESET_TOKEN_EXPIRES_IN = '15m';
process.env.DATABASE_FILE = ':memory:';
process.env.DATABASE_PROVIDER = 'sqlite';
process.env.NODE_ENV = 'test';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));
