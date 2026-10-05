const { Router } = require('express');
const { authenticate } = require('../middleware/auth.js');
const {
  updateSettings,
  findRowById,
  toPublic,
} = require('../models/accounts.js');

const router = Router();

// Every Settings route requires the user to be logged in.
router.use(authenticate);

// --------------------------------------------------
// GET /api/settings
// --------------------------------------------------

router.get('/', (req, res) => {
  const user = toPublic(
    findRowById(req.user.id)
  );

  if (!user) {
    return res.status(404).json({
      message: 'User account could not be found.',
    });
  }

  return res.json({
    user,
  });
});

// --------------------------------------------------
// PUT /api/settings
// --------------------------------------------------

router.put('/', (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    businessName,
    registrationNumber,
    vatNumber,
    industry,
    businessSize,
    country,
    currency,
  } = req.body;

  // Required fields.
  if (
    !String(firstName || '').trim() ||
    !String(lastName || '').trim() ||
    !String(businessName || '').trim() ||
    !String(industry || '').trim() ||
    !String(businessSize || '').trim() ||
    !String(country || '').trim() ||
    !String(currency || '').trim()
  ) {
    return res.status(400).json({
      message: 'Please complete all required fields.',
    });
  }

  const updatedUser = updateSettings(
    req.user.id,
    {
      user: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: String(phone || '').trim(),
      },

      business: {
        businessName: String(businessName).trim(),
        registrationNumber: String(
          registrationNumber || ''
        ).trim(),
        vatNumber: String(
          vatNumber || ''
        ).trim(),
        industry: String(industry).trim(),
        businessSize: String(businessSize).trim(),
        country: String(country).trim(),
        currency: String(currency).trim(),
      },
    }
  );

  return res.json({
    message: 'Settings saved successfully.',
    user: updatedUser,
  });
});

module.exports = router;