// Mock all the dependencies before requiring app
const mockAccounts = {
  findRowByEmail: jest.fn(),
  findRowById: jest.fn(),
  toPublic: jest.fn(),
  createUserWithBusiness: jest.fn(),
  saveResetToken: jest.fn(),
  findValidResetToken: jest.fn(),
  consumeResetToken: jest.fn(),
  recentResetTokenExists: jest.fn(),
  setSageStatus: jest.fn(),
  completeOnboarding: jest.fn(),
  listUsers: jest.fn()
};

const mockSecurity = {
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  signToken: jest.fn().mockReturnValue('test_token'),
  verifyToken: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
  newResetToken: jest.fn().mockReturnValue({ raw: 'a'.repeat(64), hash: 'hashed_token' }),
  sha256: jest.fn().mockReturnValue('hashed_token'),
  DUMMY_HASH: 'dummy_hash',
  COOKIE_NAME: 'vb_token'
};

const mockMailer = {
  mailConfigured: false,
  sendInBackground: jest.fn()
};

// Mock modules before requiring app
jest.mock('../../src/models/accounts.js', () => mockAccounts);
jest.mock('../../src/utils/security.js', () => mockSecurity);
jest.mock('../../src/utils/mailer.js', () => mockMailer);

// Now we can require app
const request = require('supertest');
const app = require('../../src/app.js');

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /', () => {
    it('should return API info', async () => {
      const res = await request(app)
        .get('/')
        .expect(200);
      
      expect(res.body.application).toBe('VoiceBooks API');
      expect(res.body.status).toBe('running');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const registerData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: {
          businessName: 'Test Business',
          industry: 'Technology',
          businessSize: '1',
          country: 'US',
          currency: 'USD'
        }
      };

      mockAccounts.findRowByEmail.mockReturnValue(null);
      mockAccounts.createUserWithBusiness.mockReturnValue(1);
      mockAccounts.findRowById.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed_password'
      });
      mockAccounts.toPublic.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'business_owner'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(res.body.message).toBe('Account created.');
      expect(res.body.user).toBeDefined();
      expect(mockSecurity.setAuthCookie).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      const registerData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: {
          businessName: 'Test Business',
          industry: 'Technology',
          businessSize: '1',
          country: 'US',
          currency: 'USD'
        }
      };

      mockAccounts.findRowByEmail.mockReturnValue({ id: 1 });

      const res = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(409);

      expect(res.body.message).toBe('An account with this email already exists.');
    });

    it('should reject invalid data', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'User',
        email: 'invalid-email',
        password: 'short',
        confirmPassword: 'short',
        role: 'business_owner'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123'
      };

      mockAccounts.findRowByEmail.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User'
      });
      
      mockAccounts.toPublic.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.message).toBe('Signed in.');
      expect(res.body.user).toBeDefined();
      expect(mockSecurity.setAuthCookie).toHaveBeenCalled();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      mockAccounts.findRowByEmail.mockReturnValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.message).toBe('Incorrect email or password.');
    });

    it('should reject invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: ''
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(invalidData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const forgotData = {
        email: 'test@example.com'
      };

      mockAccounts.findRowByEmail.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test'
      });
      
      mockAccounts.recentResetTokenExists.mockReturnValue(false);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(200);

      expect(res.body.message).toContain('reset link');
      expect(mockAccounts.saveResetToken).toHaveBeenCalled();
    });

    it('should return same response for non-existent email', async () => {
      const forgotData = {
        email: 'nonexistent@example.com'
      };

      mockAccounts.findRowByEmail.mockReturnValue(null);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotData)
        .expect(200);

      expect(res.body.message).toContain('reset link');
      expect(mockAccounts.saveResetToken).not.toHaveBeenCalled();
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        email: 'invalid-email'
      };

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send(invalidData)
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-reset-token', () => {
    it('should verify valid reset token', async () => {
      mockAccounts.findValidResetToken.mockReturnValue({ id: 1, user_id: 1 });

      const res = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: 'a'.repeat(64) })
        .expect(200);

      expect(res.body.valid).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      mockAccounts.findValidResetToken.mockReturnValue(null);

      const res = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: 'a'.repeat(64) })
        .expect(200);

      expect(res.body.valid).toBe(false);
    });

    it('should reject invalid token format', async () => {
      const res = await request(app)
        .post('/api/auth/verify-reset-token')
        .send({ token: 'invalid' })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      mockAccounts.findValidResetToken.mockReturnValue({ id: 1, user_id: 1 });
      mockAccounts.findRowById.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test'
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'a'.repeat(64),
          password: 'NewValidPass123',
          confirmPassword: 'NewValidPass123'
        })
        .expect(200);

      expect(res.body.message).toBe('Password updated. You can now sign in.');
      expect(mockAccounts.consumeResetToken).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockAccounts.findValidResetToken.mockReturnValue(null);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'a'.repeat(64),
          password: 'NewValidPass123',
          confirmPassword: 'NewValidPass123'
        })
        .expect(400);

      expect(res.body.message).toContain('invalid or has expired');
    });

    it('should reject invalid password', async () => {
      mockAccounts.findValidResetToken.mockReturnValue({ id: 1, user_id: 1 });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'a'.repeat(64),
          password: 'short',
          confirmPassword: 'short'
        })
        .expect(400);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body.message).toBe('Signed out.');
      expect(mockSecurity.clearAuthCookie).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.message).toBe('Please sign in to continue.');
    });
  });
});
