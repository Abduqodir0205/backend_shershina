/**
 * Sale Service (legacy): Chiqim (3.3) va Rabochiy sotuv (3.6) mantiqi.
 * Sotuv bo'lganda chiqim jadvaliga foyda bilan yozish, rabochiy_balon sotuvini saqlash.
 * Barcha operatsiyalar Prisma tranzaksiyasi orqali.
 */
const { Prisma } = require('@prisma/client');
const { prisma } = require('../utils/database');
const logger = require('../utils/logger');
const inventoryService = require('./inventoryService');
const legacyData = require('./legacyDataService');

/**
 * Chiqim yozuvi + ixtiyoriy rabochiy balonlar omborga qo'shish + sync olinish_kerak.
 * @param {Object} data - razmer, balon_turi, sotildi, umumiy, rabochiy_soni?, rabochiy_narx?, rabochiy_razmer?, rabochiy_balon_turi?, rabochiy_holat?
 * @param {number} shopId
 * @returns {{ naqdFoyda, zaxiraFoyda, foyda, rabIds }}
 */
async function saveChiqim(data, shopId = 1) {
  const {
    razmer,
    balon_turi,
    sotildi,
    umumiy,
    rabochiy_soni = 0,
    rabochiy_narx = 0,
    rabochiy_razmer,
    rabochiy_balon_turi,
    rabochiy_holat = 'yaxshi',
  } = data;

  const rabochiySumma = rabochiy_soni * rabochiy_narx;
  const naqdTushum = umumiy - rabochiySumma;
  const xarajat = (await inventoryService.getKelganNarx(razmer, balon_turi, shopId)) * sotildi;
  const naqdFoyda = Math.round(naqdTushum - xarajat);
  const zaxiraFoyda = rabochiySumma;
  const foyda = naqdFoyda + zaxiraFoyda;

  const rabIds = [];

  await prisma.$transaction(async (tx) => {
    await tx.chiqim.create({
      data: {
        razmer,
        balonTuri: balon_turi,
        sotildi,
        umumiyQiymat: umumiy,
        foyda,
        naqdFoyda,
        zaxiraFoyda,
        rabochiyOlindi: rabochiy_soni,
        rabochiyNarxi: rabochiy_narx,
        shopId,
      },
    });

    if (rabochiy_soni > 0 && rabochiy_razmer && rabochiy_balon_turi) {
      for (let i = 0; i < rabochiy_soni; i++) {
        const r = await tx.rabochiyBalon.create({
          data: {
            razmer: rabochiy_razmer,
            balonTuri: rabochiy_balon_turi,
            soni: 1,
            narx: rabochiy_narx,
            holat: rabochiy_holat,
            shopId,
          },
        });
        rabIds.push(r.id);
      }
    }
  });

  await inventoryService.syncOlinishKerakFromStock(shopId);

  return { naqdFoyda, zaxiraFoyda, foyda, rabIds };
}

/**
 * Mobil/backend API dan yangi formatdagi sotuvni saqlash.
 * - tires (Kirim) quantity dan ayiradi
 * - sales (Chiqim) jadvaliga yangi va legacy ustunlar bilan yozadi
 * - agar trade-in bo'lsa, rabochiy_balon ga yozadi
 */
async function saveSaleFromApi({ shopId, tireId, quantity, totalPrice, tradeIn, user }) {
  const sid = shopId ?? 1;
  const q = Math.max(0, Math.round(Number(quantity) || 0));
  const total = Number(totalPrice);

  if (!tireId || q <= 0 || !Number.isFinite(total) || total <= 0) {
    const err = new Error('Noto\'g\'ri sotuv ma\'lumotlari');
    err.code = 'INVALID_SALE_PAYLOAD';
    throw err;
  }

  const tire = await prisma.kirim.findUnique({
    where: { id: tireId },
  });

  if (!tire || (tire.shopId != null && tire.shopId !== sid)) {
    const err = new Error('Shina topilmadi yoki boshqa do\'konga tegishli');
    err.code = 'TIRE_NOT_FOUND';
    throw err;
  }

  if (tire.quantity < q) {
    const err = new Error('Skladda yetarli shina yo\'q');
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }

  const razmer = tire.size;
  const balon_turi = tire.brand;

  // Trade-in (rabochiy balon) parametrlari
  const trade = tradeIn || {};
  const rabCount = Math.max(0, Math.round(Number(trade.count) || 0));
  const rabPrice = Math.round(Number(trade.price) || 0);
  const rabSize = trade.size || razmer;
  const rabBrand = trade.brand || balon_turi;
  const rabHolat = trade.condition || 'yaxshi';

  const rabochiySumma = rabCount * rabPrice;
  const naqdTushum = total - rabochiySumma;
  const xarajatPer = await inventoryService.getKelganNarx(razmer, balon_turi, sid);
  const xarajat = xarajatPer * q;
  const naqdFoyda = Math.round(naqdTushum - xarajat);
  const zaxiraFoyda = rabochiySumma;
  const foyda = naqdFoyda + zaxiraFoyda;

  const adminId = null; // legacy Admin jadvali bilan bog'lanmagan; hozircha null.

  const txResult = await prisma.$transaction(async (tx) => {
    const updatedTire = await tx.kirim.update({
      where: { id: tireId },
      data: { quantity: { decrement: q } },
    });

    if (updatedTire.quantity < 0) {
      const err = new Error('Skladda yetarli shina yo\'q');
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    const chiqim = await tx.chiqim.create({
      data: {
        itemType: 'NEW',
        tireId,
        quantity: q,
        totalPrice: total,
        adminId,
        shopId: sid,
        // Legacy ustunlar bot va eski tizimlar uchun
        razmer,
        balonTuri: balon_turi,
        sotildi: q,
        umumiyQiymat: total,
        foyda,
        naqdFoyda,
        zaxiraFoyda,
        rabochiyOlindi: rabCount || null,
        rabochiyNarxi: rabCount > 0 ? rabPrice : null,
      },
    });

    const rabIds = [];
    if (rabCount > 0 && rabSize && rabBrand && rabPrice > 0) {
      for (let i = 0; i < rabCount; i++) {
        const r = await tx.rabochiyBalon.create({
          data: {
            razmer: rabSize,
            balonTuri: rabBrand,
            soni: 1,
            narx: rabPrice,
            holat: rabHolat,
            shopId: sid,
          },
        });
        rabIds.push(r.id);
      }
    }

    return { chiqim, updatedTire, rabIds };
  });

  await inventoryService.syncOlinishKerakFromStock(sid);

  return {
    shopId: sid,
    tireId,
    quantity: q,
    totalPrice: total,
    naqdFoyda,
    zaxiraFoyda,
    foyda,
    chiqim: txResult.chiqim,
    updatedTire: txResult.updatedTire,
    rabochiyIds: txResult.rabIds,
  };
}

/**
 * Rabochiy balonlar savatini sotuv sifatida saqlash: rabochiy_sotuv yozuvlari + rabochiy_balon dan o'chirish.
 * @param {Array<{ id: number, razmer: string, balon_turi: string, narx: number }>} rows
 * @param {number} totalSotilganSumma - jami sotilgan summa (taqsimlanadi)
 * @param {number} shopId
 * @returns {{ count, totalOlingan, sotilganSumma, foyda }}
 */
async function saveRabochiySotuv(rows, totalSotilganSumma, shopId = 1) {
  const totalOlingan = rows.reduce((s, r) => s + Number(r.narx), 0);
  const sotilganPerItem = Math.round(totalSotilganSumma / rows.length);
  const ids = rows.map((r) => r.id);

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.rabochiySotuv.create({
        data: {
          rabochiyBalonId: row.id,
          razmer: row.razmer,
          balonTuri: row.balon_turi,
          olinganNarx: row.narx,
          sotilganNarx: sotilganPerItem,
          shopId,
        },
      });
    }
    await tx.rabochiyBalon.deleteMany({
      where: { id: { in: ids } },
    });
  });

  const foyda = totalSotilganSumma - totalOlingan;
  return {
    count: rows.length,
    totalOlingan,
    sotilganSumma: totalSotilganSumma,
    foyda,
  };
}

/**
 * Chiqim yozuvlari sana oralig'ida.
 */
const DEFAULT_SHOP_ID = 1;

async function getChiqimByDateRange(startDate, endDate, shopId = 1) {
  const sid = shopId ?? DEFAULT_SHOP_ID;
  return prisma.chiqim.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      shopId: sid,
    },
    orderBy: { id: 'desc' },
    include: { kirim: true, usedTire: true },
  });
}

/**
 * Rabochiy sotuv yozuvlari sana oralig'ida.
 */
async function getRabochiySotuvByDateRange(startDate, endDate, shopId = 1) {
  const sid = shopId ?? DEFAULT_SHOP_ID;
  return prisma.rabochiySotuv.findMany({
    where: {
      sana: { gte: startDate, lte: endDate },
      shopId: sid,
    },
    orderBy: { id: 'desc' },
  });
}

/**
 * Chiqim jami (umumiy_qiymat/total_price, foyda, naqd_foyda, zaxira_foyda) shop va sana bo'yicha.
 * Legacy (razmer, sotildi, umumiy_qiymat) va yangi (tire_id, quantity, total_price) yozuvlarni birlashtiradi.
 */
async function getChiqimTotals(shopId, startDate, endDate = null) {
  const sid = shopId ?? DEFAULT_SHOP_ID;
  const conditions = [Prisma.sql`shop_id = ${sid}`];
  if (startDate) conditions.push(Prisma.sql`created_at >= ${startDate}`);
  if (endDate) conditions.push(Prisma.sql`created_at <= ${endDate}`);
  const whereClause = conditions.length ? Prisma.join(conditions, ' AND ') : Prisma.empty;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
    SELECT
      COALESCE(SUM(COALESCE(umumiy_qiymat, total_price)), 0)::float AS sum,
      COALESCE(SUM(COALESCE(sotildi, quantity)), 0)::int AS sotildi,
      COALESCE(SUM(foyda), 0)::float AS foyda,
      COALESCE(SUM(naqd_foyda), 0)::float AS naqd_foyda,
      COALESCE(SUM(zaxira_foyda), 0)::float AS zaxira_foyda
    FROM sales
    WHERE ${whereClause}
    `
  );
  const r = Array.isArray(rows) ? rows[0] : rows;
  const sum = Number(r?.sum ?? 0);
  const sotildi = Number(r?.sotildi ?? 0);
  const foyda = Number(r?.foyda ?? 0);
  const naqd_foyda = Number(r?.naqd_foyda ?? 0);
  const zaxira_foyda = Number(r?.zaxira_foyda ?? 0);
  return {
    sum,
    foyda: foyda || sum,
    naqd_foyda,
    zaxira_foyda,
    sotildi,
  };
}

/**
 * Rabochiy balon qo'shish (bitta yozuv).
 */
async function addRabochiyBalon(razmer, balonTuri, soni, narx, holat, shopId = 1) {
  return prisma.rabochiyBalon.create({
    data: { razmer, balonTuri, soni, narx, holat: holat || 'yaxshi', shopId },
  });
}

module.exports = {
  saveChiqim,
  saveRabochiySotuv,
  getChiqimByDateRange,
  getRabochiySotuvByDateRange,
  getChiqimTotals,
  addRabochiyBalon,
  saveSaleFromApi,
};
