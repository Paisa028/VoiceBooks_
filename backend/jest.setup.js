// Jest setup file
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.RESET_TOKEN_EXPIRES_IN = '15m';
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
  })
}));
