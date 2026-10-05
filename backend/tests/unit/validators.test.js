const { z } = require('zod');
const validators = require('../../src/validators/auth.schemas.js');

describe('Auth Validators', () => {
  describe('Password Schema', () => {
    it('should accept a valid password', () => {
      const validPassword = 'ValidPass123';
      const result = validators.passwordSchema.safeParse(validPassword);
      
      expect(result.success).toBe(true);
    });

    it('should reject password without lowercase letter', () => {
      const invalidPassword = 'VALIDPASS123';
      const result = validators.passwordSchema.safeParse(invalidPassword);
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password needs a lowercase letter');
    });

    it('should reject password without uppercase letter', () => {
      const invalidPassword = 'validpass123';
      const result = validators.passwordSchema.safeParse(invalidPassword);
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password needs an uppercase letter');
    });

    it('should reject password without number', () => {
      const invalidPassword = 'ValidPassWord';
      const result = validators.passwordSchema.safeParse(invalidPassword);
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password needs a number');
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidPassword = 'Val1';
      const result = validators.passwordSchema.safeParse(invalidPassword);
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password needs at least 8 characters');
    });

    it('should reject password longer than 72 characters', () => {
      const invalidPassword = 'A'.repeat(73) + 'a1';
      const result = validators.passwordSchema.safeParse(invalidPassword);
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password must be 72 characters or fewer');
    });

    it('should reject empty password', () => {
      const result = validators.passwordSchema.safeParse('');
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password is required');
    });
  });

  describe('Email Validation', () => {
    it('should accept a valid email', () => {
      const validEmail = 'test@example.com';
      const result = validators.registerSchema.safeParse({
        firstName: 'Test',
        lastName: 'User',
        email: validEmail,
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
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidEmail = 'invalid-email';
      const result = validators.registerSchema.safeParse({
        firstName: 'Test',
        lastName: 'User',
        email: invalidEmail,
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
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Enter a valid email address');
    });

    it('should convert email to lowercase', () => {
      const email = 'Test@Example.COM';
      const result = validators.registerSchema.safeParse({
        firstName: 'Test',
        lastName: 'User',
        email: email,
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
      });
      
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
    });
  });

  describe('Register Schema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: {
          businessName: 'Test Business',
          registrationNumber: 'REG123',
          vatNumber: 'VAT123',
          industry: 'Technology',
          businessSize: '1',
          country: 'US',
          currency: 'USD'
        }
      };
      
      const result = validators.registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'DifferentPass123',
        role: 'business_owner',
        business: {
          businessName: 'Test Business',
          industry: 'Technology',
          businessSize: '1',
          country: 'US',
          currency: 'USD'
        }
      };
      
      const result = validators.registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Passwords do not match');
    });

    it('should reject invalid role', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'admin',
        business: {
          businessName: 'Test Business',
          industry: 'Technology',
          businessSize: '1',
          country: 'US',
          currency: 'USD'
        }
      };
      
      const result = validators.registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Choose an account type');
    });
  });

  describe('Login Schema', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'ValidPass123'
      };
      
      const result = validators.loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'john@example.com',
        password: ''
      };
      
      const result = validators.loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Password is required');
    });
  });

  describe('Forgot Password Schema', () => {
    it('should accept valid email', () => {
      const result = validators.forgotPasswordSchema.safeParse({ email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validators.forgotPasswordSchema.safeParse({ email: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('Reset Password Schema', () => {
    it('should accept valid reset token and password', () => {
      const validToken = 'a'.repeat(64);
      const result = validators.resetPasswordSchema.safeParse({
        token: validToken,
        password: 'NewValidPass123',
        confirmPassword: 'NewValidPass123'
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'invalid-token';
      const result = validators.resetPasswordSchema.safeParse({
        token: invalidToken,
        password: 'NewValidPass123',
        confirmPassword: 'NewValidPass123'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('This reset link is invalid');
    });

    it('should reject when new passwords do not match', () => {
      const validToken = 'a'.repeat(64);
      const result = validators.resetPasswordSchema.safeParse({
        token: validToken,
        password: 'NewValidPass123',
        confirmPassword: 'DifferentPass123'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Passwords do not match');
    });
  });

  describe('Business Schema', () => {
    it('should accept valid business data', () => {
      const validBusiness = {
        businessName: 'Test Business',
        registrationNumber: 'REG123',
        vatNumber: 'VAT123',
        industry: 'Technology',
        businessSize: '1',
        country: 'US',
        currency: 'USD'
      };
      
      const result = validators.registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: validBusiness
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject empty business name', () => {
      const invalidBusiness = {
        businessName: '',
        industry: 'Technology',
        businessSize: '1',
        country: 'US',
        currency: 'USD'
      };
      
      const result = validators.registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: invalidBusiness
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Enter your business name');
    });

    it('should reject invalid business size', () => {
      const invalidBusiness = {
        businessName: 'Test Business',
        industry: 'Technology',
        businessSize: 'invalid',
        country: 'US',
        currency: 'USD'
      };
      
      const result = validators.registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123',
        confirmPassword: 'ValidPass123',
        role: 'business_owner',
        business: invalidBusiness
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Select a business size');
    });
  });

  describe('Sage Schema', () => {
    it('should accept connect action with region', () => {
      const result = validators.sageSchema.safeParse({
        action: 'connect',
        region: 'UK'
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept skip action without region', () => {
      const result = validators.sageSchema.safeParse({
        action: 'skip'
      });
      
      expect(result.success).toBe(true);
    });

    it('should reject connect action without region', () => {
      const result = validators.sageSchema.safeParse({
        action: 'connect'
      });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('Select your Sage region');
    });
  });

  describe('Verify Reset Token Schema', () => {
    it('should accept valid token format', () => {
      const validToken = 'a'.repeat(64);
      const result = validators.verifyResetTokenSchema.safeParse({ token: validToken });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid token format', () => {
      const result = validators.verifyResetTokenSchema.safeParse({ token: 'invalid' });
      
      expect(result.success).toBe(false);
      expect(result.error.errors[0].message).toBe('This reset link is invalid');
    });
  });

  describe('SELF_ASSIGNABLE_ROLES', () => {
    it('should contain expected roles', () => {
      expect(validators.SELF_ASSIGNABLE_ROLES).toContain('business_owner');
      expect(validators.SELF_ASSIGNABLE_ROLES).toContain('accountant');
      expect(validators.SELF_ASSIGNABLE_ROLES).toContain('bookkeeper');
      expect(validators.SELF_ASSIGNABLE_ROLES).not.toContain('admin');
    });
  });
});
