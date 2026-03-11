/**
 * API Layer: Mobil ilova uchun Express routerlari.
 * /api/auth ochiq; qolganlari JWT. Inventory va reports: ADMIN va SELLER. USER kira olmaydi.
 */
const express = require('express');
const { jwtAuth } = require('./middleware/jwtAuth');
const { roleCheck } = require('./middleware/roleCheck');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shopRoutes = require('./routes/shops');
const inventoryRoutes = require('./routes/inventory');
const reportsRoutes = require('./routes/reports');
const salesRoutes = require('./routes/sales');

const router = express.Router();
router.use(express.json());

router.use('/auth', authRoutes);

const protected = express.Router();
protected.use(jwtAuth);
protected.use('/users', userRoutes);
protected.use('/shops', shopRoutes);
protected.use('/inventory', roleCheck(['ADMIN', 'SELLER']), inventoryRoutes);
protected.use('/reports', roleCheck(['ADMIN', 'SELLER']), reportsRoutes);
protected.use('/sales', roleCheck(['ADMIN', 'SELLER']), salesRoutes);
router.use(protected);

router.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi', path: req.path });
});

router.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Server xatosi', code: 'INTERNAL_ERROR' });
});

module.exports = router;
