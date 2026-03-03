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

router.get('/summary', async (req, res, next) => {
  try {
    const shopId = parseShopId(req);
    const summary = await inventoryService.getFullInventorySummary(shopId);
    res.json(summary);
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
