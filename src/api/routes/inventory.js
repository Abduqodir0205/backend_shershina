const express = require('express');
const router = express.Router();
const inventoryService = require('../../services/inventoryService');

// SELLER faqat o'z do'konini ko'radi (shop_id); query.shopId e'tiborsiz.
function parseShopId(req) {
  const role = (req.user?.role || '').toUpperCase();
  const raw =
    role === 'SELLER'
      ? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID
      : req.query.shopId ?? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID;
  const id = parseInt(raw, 10);
  return isNaN(id) ? 1 : id;
}

function parseShopIdFromBody(req) {
  const role = (req.user?.role || '').toUpperCase();
  const raw =
    role === 'SELLER'
      ? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID
      : req.body.shopId ?? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID;
  const id = parseInt(raw, 10);
  return isNaN(id) ? 1 : id;
}

router.get('/summary', async (req, res, next) => {
  try {
    const shopId = parseShopId(req);
    const summary = await inventoryService.getFullInventorySummary(shopId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Yangi shina kirimi (inventory qo'shish) — tires (kirim) jadvaliga yozadi yoki quantity ni oshiradi.
router.post('/add', async (req, res, next) => {
  try {
    const shopId = parseShopIdFromBody(req);
    const { brand, size, quantity, priceBuy, priceSell } = req.body || {};

    if (!brand || !size || quantity == null) {
      return res.status(400).json({ error: 'brand, size va quantity majburiy', code: 'INVALID_PAYLOAD' });
    }

    const q = Math.round(Number(quantity) || 0);
    if (!Number.isFinite(q) || q <= 0) {
      return res.status(400).json({ error: 'quantity musbat butun son bo\'lishi kerak', code: 'INVALID_QUANTITY' });
    }

    const item = await inventoryService.addKirimItem({
      shopId,
      brand,
      size,
      quantity: q,
      priceBuy,
      priceSell,
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.get('/new', async (req, res, next) => {
  try {
    const shopId = parseShopId(req);
    const data = await inventoryService.getNewTireBalance(shopId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/used', async (req, res, next) => {
  try {
    const shopId = parseShopId(req);
    const data = await inventoryService.getUsedTireBalance(shopId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/rabochiy', async (req, res, next) => {
  try {
    const shopId = parseShopId(req);
    const data = await inventoryService.getRabochiyBalonBalance(shopId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
