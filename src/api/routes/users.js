const express = require('express');
const router = express.Router();
const { getRoleDisplayName } = require('../utils/roleDisplay');

/**
 * GET /api/users/me
 * JWT talab qilinadi. Joriy foydalanuvchi ma'lumotlari (passwordHash siz). roleDisplayName: SELLER -> "Sotuvchi".
 */
function toSafeUser(user) {
  if (!user) return user;
  const u = { ...user, passwordHash: undefined };
  if (typeof u.telegramId === 'bigint') u.telegramId = u.telegramId.toString();
  u.roleDisplayName = getRoleDisplayName(u.role);
  return u;
}

router.get('/me', (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Foydalanuvchi topilmadi', code: 'UNAUTHORIZED' });
  }
  res.json(toSafeUser(user));
});

module.exports = router;
