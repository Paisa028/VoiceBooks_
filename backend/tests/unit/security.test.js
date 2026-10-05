const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

// Mock the config module
jest.mock('../../src/config.js', () => ({
  config: {
    bcryptRounds: 10,
    jwtSecret: 'test_secret_key',
    sessionMinutes: 60,
    cookieSecure: false
  }
}));

const security = require('../../src/utils/security.js');

describe('Security Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await security.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(bcrypt.compareSync(password, hash)).toBe(true);
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await security.hashPassword(password);

      const result = await security.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await security.hashPassword(password);

      const result = await security.verifyPassword(
        wrongPassword,
        hash
      );

      expect(result).toBe(false);
    });

    it('should have a dummy hash for timing attacks', () => {
      expect(security.DUMMY_HASH).toBeDefined();
      expect(typeof security.DUMMY_HASH).toBe('string');

      expect(
        bcrypt.compareSync(
          'not-a-real-password',
          security.DUMMY_HASH
        )
      ).toBe(true);
    });
  });

  describe('JWT Operations', () => {
    const testUser = {
      id: 1,
      role: 'user'
    };

    it('should sign a token with user data', () => {
      const token = security.signToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify a valid token', () => {
      const token = security.signToken(testUser);
      const decoded = security.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(String(testUser.id));
      expect(decoded.role).toBe(testUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() =>
        security.verifyToken('invalid.token.here')
      ).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        {
          sub: String(testUser.id),
          role: testUser.role
        },
        'test_secret_key',
        {
          algorithm: 'HS256',
          expiresIn: '0s'
        }
      );

      expect(() =>
        security.verifyToken(expiredToken)
      ).toThrow();
    });
  });

  describe('Cookie Operations', () => {
    it('should set auth cookie with correct options', () => {
      const mockRes = {
        cookie: jest.fn()
      };

      const token = security.signToken({
        id: 1,
        role: 'user'
      });

      security.setAuthCookie(mockRes, token);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        security.COOKIE_NAME,
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/'
        })
      );
    });

    it('should clear auth cookie', () => {
      const mockRes = {
        clearCookie: jest.fn()
      };

      security.clearAuthCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        security.COOKIE_NAME,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/'
        })
      );
    });
  });

  describe('Password Reset Tokens', () => {
    it('should generate a new reset token', () => {
      const { raw, hash } =
        security.newResetToken();

      expect(raw).toBeDefined();
      expect(raw.length).toBe(64);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);

      expect(hash).toBe(
        crypto
          .createHash('sha256')
          .update(raw)
          .digest('hex')
      );
    });

    it('should generate unique tokens each time', () => {
      const token1 = security.newResetToken();
      const token2 = security.newResetToken();

      expect(token1.raw).not.toBe(token2.raw);
      expect(token1.hash).not.toBe(token2.hash);
    });

    it('should correctly hash values with sha256', () => {
      const testValue = 'test-value';

      const expectedHash = crypto
        .createHash('sha256')
        .update(testValue)
        .digest('hex');

      const result = security.sha256(testValue);

      expect(result).toBe(expectedHash);
    });
  });

  describe('Cookie Name Constant', () => {
    it('should export COOKIE_NAME', () => {
      expect(security.COOKIE_NAME).toBe('vb_token');
    });
  });
});