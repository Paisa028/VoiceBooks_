// Mock the database module
const mockDb = {
  prepare: jest.fn(),

  transaction: jest.fn((callback) => callback)
};

// Mock the db/index.js module
jest.mock('../../src/db/index.js', () => ({
  db: mockDb
}));

const accounts = require('../../src/models/accounts.js');

describe('Accounts Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findRowByEmail', () => {
    it('should query for user by email', () => {
      const mockGet = jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });
      
      mockDb.prepare.mockReturnValue({ get: mockGet });
      
      const result = accounts.findRowByEmail('test@example.com');
      
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE u.email = ?'));
      expect(mockGet).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    it('should return undefined when user not found', () => {
      const mockGet = jest.fn().mockReturnValue(undefined);
      
      mockDb.prepare.mockReturnValue({ get: mockGet });
      
      const result = accounts.findRowByEmail('nonexistent@example.com');
      
      expect(result).toBeUndefined();
    });
  });

  describe('findRowById', () => {
    it('should query for user by id', () => {
      const mockGet = jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });
      
      mockDb.prepare.mockReturnValue({ get: mockGet });
      
      const result = accounts.findRowById(1);
      
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE u.id = ?'));
      expect(mockGet).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      });
    });
  });

  describe('toPublic', () => {
    it('should convert user row to public object without sensitive data', () => {
      const userRow = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890',
        role: 'business_owner',
        role_label: 'Business Owner',
        onboarding_completed: 1,
        created_at: '2024-01-01',
        business_id: 1,
        business_name: 'Test Business',
        registration_number: 'REG123',
        vat_number: 'VAT123',
        industry: 'Technology',
        business_size: '1',
        country: 'US',
        currency: 'USD',
        sage_status: 'connected',
        sage_region: 'UK'
      };
      
      const result = accounts.toPublic(userRow);
      
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        role: 'business_owner',
        roleLabel: 'Business Owner',
        onboardingCompleted: true,
        createdAt: '2024-01-01',
        business: {
          name: 'Test Business',
          registrationNumber: 'REG123',
          vatNumber: 'VAT123',
          industry: 'Technology',
          size: '1',
          country: 'US',
          currency: 'USD',
          sageStatus: 'connected',
          sageRegion: 'UK'
        }
      });
    });

    it('should return null for null input', () => {
      const result = accounts.toPublic(null);
      expect(result).toBeNull();
    });

    it('should handle user without business', () => {
      const userRow = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'business_owner',
        role_label: 'Business Owner',
        onboarding_completed: 0,
        created_at: '2024-01-01'
      };
      
      const result = accounts.toPublic(userRow);
      
      expect(result.business).toBeNull();
    });
  });

 describe('createUserWithBusiness', () => {
  it('should create user and business in transaction', () => {
    const mockRoleGet = jest.fn().mockReturnValue({
      id: 1,
      name: 'business_owner',
      self_assignable: 1
    });

    const mockUserRun = jest.fn().mockReturnValue({
      lastInsertRowid: 1
    });

    const mockBusinessRun = jest.fn();

    mockDb.prepare.mockImplementation((sql) => {
      if (sql.includes('SELECT id FROM roles')) {
        return { get: mockRoleGet };
      }

      if (sql.includes('INSERT INTO users')) {
        return { run: mockUserRun };
      }

      if (sql.includes('INSERT INTO business_profiles')) {
        return { run: mockBusinessRun };
      }

      return { run: jest.fn() };
    });

    const user = {
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'business_owner'
    };

    const business = {
      businessName: 'Test Business',
      registrationNumber: 'REG123',
      vatNumber: 'VAT123',
      industry: 'Technology',
      businessSize: '1',
      country: 'US',
      currency: 'USD'
    };

    const result = accounts.createUserWithBusiness({
      user,
      business
    });

    expect(result).toBe(1);
    expect(mockRoleGet).toHaveBeenCalledWith('business_owner');
    expect(mockUserRun).toHaveBeenCalled();
    expect(mockBusinessRun).toHaveBeenCalled();
  });

  it('should throw error for invalid role', () => {
    const mockGet = jest.fn().mockReturnValue(null);

    mockDb.prepare.mockImplementation((sql) => {
      if (sql.includes('SELECT id FROM roles')) {
        return { get: mockGet };
      }

      return { run: jest.fn() };
    });

    const user = {
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      role: 'invalid_role'
    };

    const business = {
      businessName: 'Test Business',
      industry: 'Technology',
      businessSize: '1',
      country: 'US',
      currency: 'USD'
    };

    expect(() =>
      accounts.createUserWithBusiness({
        user,
        business
      })
    ).toThrow('Invalid role');
  });
});

describe('setSageStatus', () => {
  it('should update sage status for user', () => {
    const mockRun = jest.fn();

    mockDb.prepare.mockReturnValue({
      run: mockRun
    });

    accounts.setSageStatus(
      1,
      'connected',
      'UK'
    );

    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE business_profiles'
      )
    );

    expect(mockRun).toHaveBeenCalledWith(
      'connected',
      'UK',
      1
    );
  });
});

describe('completeOnboarding', () => {
  it('should mark onboarding as completed', () => {
    const mockRun = jest.fn();

    mockDb.prepare.mockReturnValue({
      run: mockRun
    });

    accounts.completeOnboarding(1);

    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE users SET onboarding_completed = 1'
      )
    );

    expect(mockRun).toHaveBeenCalledWith(1);
  });
});

describe('listUsers', () => {
  it('should return list of users', () => {
    const mockAll = jest.fn().mockReturnValue([
      {
        id: 1,
        email: 'user1@example.com',
        first_name: 'User',
        last_name: 'One',
        role: 'business_owner',
        created_at: '2024-01-01',
        business_name: 'Business 1'
      },
      {
        id: 2,
        email: 'user2@example.com',
        first_name: 'User',
        last_name: 'Two',
        role: 'accountant',
        created_at: '2024-01-02',
        business_name: 'Business 2'
      }
    ]);

    mockDb.prepare.mockReturnValue({
      all: mockAll
    });

    const result = accounts.listUsers();

    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        'SELECT u.id, u.email'
      )
    );

    expect(result).toHaveLength(2);
  });
});

describe('Password Reset Tokens', () => {
  describe('saveResetToken', () => {
    it('should save reset token for user', () => {
      const mockRun1 = jest.fn();
      const mockRun2 = jest.fn();

      mockDb.prepare
        .mockReturnValueOnce({
          run: mockRun1
        })
        .mockReturnValueOnce({
          run: mockRun2
        });

      accounts.saveResetToken(
        1,
        'token_hash',
        '2024-12-31'
      );

      expect(mockRun1).toHaveBeenCalledWith(1);

      expect(mockRun2).toHaveBeenCalledWith(
        1,
        'token_hash',
        '2024-12-31'
      );
    });
  });

  describe('findValidResetToken', () => {
    it('should return valid token', () => {
      const mockGet = jest.fn().mockReturnValue({
        id: 1,
        user_id: 1,
        token_hash: 'valid_hash',
        expires_at: new Date(
          Date.now() + 1000000
        ).toISOString(),
        used_at: null
      });

      mockDb.prepare.mockReturnValue({
        get: mockGet
      });

      const result =
        accounts.findValidResetToken(
          'valid_hash'
        );

      expect(result).toEqual({
        id: 1,
        user_id: 1,
        token_hash: 'valid_hash',
        expires_at: expect.any(String),
        used_at: null
      });
    });

    it('should return null for used token', () => {
      const mockGet = jest.fn().mockReturnValue({
        id: 1,
        user_id: 1,
        token_hash: 'used_hash',
        expires_at: new Date(
          Date.now() + 1000000
        ).toISOString(),
        used_at: '2024-01-01'
      });

      mockDb.prepare.mockReturnValue({
        get: mockGet
      });

      const result =
        accounts.findValidResetToken(
          'used_hash'
        );

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const mockGet = jest.fn().mockReturnValue({
        id: 1,
        user_id: 1,
        token_hash: 'expired_hash',
        expires_at: new Date(
          Date.now() - 1000
        ).toISOString(),
        used_at: null
      });

      mockDb.prepare.mockReturnValue({
        get: mockGet
      });

      const result =
        accounts.findValidResetToken(
          'expired_hash'
        );

      expect(result).toBeNull();
    });
  });

  describe('consumeResetToken', () => {
    it('should consume reset token and update password', () => {
      const updatePasswordRun = jest.fn();
      const markTokenUsedRun = jest.fn();
      const deleteOldTokensRun = jest.fn();

      mockDb.prepare
        .mockReturnValueOnce({
          run: updatePasswordRun
        })
        .mockReturnValueOnce({
          run: markTokenUsedRun
        })
        .mockReturnValueOnce({
          run: deleteOldTokensRun
        });

      accounts.consumeResetToken(
        1,
        1,
        'new_password_hash'
      );

      expect(
        updatePasswordRun
      ).toHaveBeenCalledWith(
        'new_password_hash',
        1
      );

      expect(
        markTokenUsedRun
      ).toHaveBeenCalledWith(1);

      expect(
        deleteOldTokensRun
      ).toHaveBeenCalledWith(
        1,
        1
      );
    });
  });

  describe('recentResetTokenExists', () => {
    it('should return true for recent token', () => {
      const mockGet = jest.fn().mockReturnValue({});

      mockDb.prepare.mockReturnValue({
        get: mockGet
      });

      const result =
        accounts.recentResetTokenExists(
          1,
          3600
        );

      expect(mockGet).toHaveBeenCalledWith(
        1,
        '-3600 seconds'
      );

      expect(result).toBe(true);
    });

    it('should return false for no recent token', () => {
      const mockGet = jest.fn().mockReturnValue(null);

      mockDb.prepare.mockReturnValue({
        get: mockGet
      });

      const result =
        accounts.recentResetTokenExists(
          1,
          3600
        );

      expect(result).toBe(false);
    });
  });
});
});