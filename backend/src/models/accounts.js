const { config } = require('../config');
const toPublic = (row) =>
  row && {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    roleLabel: row.role_label,
    onboardingCompleted: !!row.onboarding_completed,
    createdAt: row.created_at,

    business: row.business_id
      ? {
          name: row.business_name,
          registrationNumber: row.registration_number,
          vatNumber: row.vat_number,
          industry: row.industry,
          size: row.business_size,
          country: row.country,
          currency: row.currency,
          sageStatus: row.sage_status,
          sageRegion: row.sage_region,
        }
      : null,
  };


module.exports = config.databaseProvider === 'firebase'
  ? { ...require('../firebase/accounts'), toPublic }
  : require('./sqliteAccounts');
