const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth.js');
const { listUsers } = require('../models/accounts.js');

const router = Router();
router.use(authenticate, requireRole('admin')); // role-based access control

router.get('/users', async (req, res) => {
  res.json({
    users: (await listUsers()).map((u) => ({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      role: u.role,
      business: u.business_name,
      createdAt: u.created_at,
    })),
  });
});

module.exports = router;
