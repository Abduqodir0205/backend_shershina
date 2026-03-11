const express = require('express');
const router = express.Router();
const saleService = require('../../services/saleService');

// SELLER faqat o'z do'konini ko'radi; ADMIN uchun body.shopId ixtiyoriy.
function parseShopIdFromBody(req) {
  const role = (req.user?.role || '').toUpperCase();
  const raw =
    role === 'SELLER'
      ? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID
      : req.body.shopId ?? req.user?.shopId ?? process.env.DEFAULT_SHOP_ID;
  const id = parseInt(raw, 10);
  return isNaN(id) ? 1 : id;
}

// Yangi sotuv (chiqim) — sales, tires va rabochiy_balon (trade-in) ni bitta tranzaksiyada yangilaydi.
router.post('/', async (req, res, next) => {
  try {
    const shopId = parseShopIdFromBody(req);
    const { tireId, quantity, totalPrice, tradeIn } = req.body || {};

    if (!tireId || quantity == null || totalPrice == null) {
      return res
        .status(400)
        .json({ error: 'tireId, quantity va totalPrice majburiy', code: 'INVALID_PAYLOAD' });
    }

    const q = Math.round(Number(quantity) || 0);
    const total = Number(totalPrice);
    if (!Number.isFinite(q) || q <= 0) {
      return res
        .status(400)
        .json({ error: 'quantity musbat butun son bo\'lishi kerak', code: 'INVALID_QUANTITY' });
    }
    if (!Number.isFinite(total) || total <= 0) {
      return res
        .status(400)
        .json({ error: 'totalPrice musbat son bo\'lishi kerak', code: 'INVALID_TOTAL_PRICE' });
    }

    const result = await saleService.saveSaleFromApi({
      shopId,
      tireId: Number(tireId),
      quantity: q,
      totalPrice: total,
      tradeIn,
      user: req.user,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: err.message, code: err.code });
    }
    if (err.code === 'TIRE_NOT_FOUND') {
      return res.status(404).json({ error: err.message, code: err.code });
    }
    if (err.code === 'INVALID_SALE_PAYLOAD') {
      return res.status(400).json({ error: err.message, code: err.code });
    }
    next(err);
  }
});

module.exports = router;

