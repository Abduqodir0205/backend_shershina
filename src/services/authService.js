/**
 * Auth Service: Mobil ilova (phone/password) uchun kirish va JWT.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../utils/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || process.env.TELEGRAM_BOT_TOKEN || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;

async function loginByPhone(phone, password) {
  if (!phone || !password) return null;
  const normalizedPhone = String(phone).trim();
  const user = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    include: { shop: true },
  });
  if (!user || !user.passwordHash) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  const token = jwt.sign(
    { userId: user.id, phone: user.phone, type: 'mobile' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return { user, token };
}

async function registerByPhone(phone, password, profile = {}) {
  const normalizedPhone = String(phone).trim();
  const existing = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
  });
  if (existing) return null;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      phone: normalizedPhone,
      passwordHash,
      firstName: profile.firstName ?? null,
      lastName: profile.lastName ?? null,
      role: 'USER',
    },
    include: { shop: true },
  });
  const token = jwt.sign(
    { userId: user.id, phone: user.phone, type: 'mobile' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return { user, token };
}

function validateToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.debug('JWT validate error:', err.message);
    return null;
  }
}

async function getUserByToken(token) {
  const payload = validateToken(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { shop: true },
  });
  if (!user) return null;
  return { user, payload };
}

module.exports = {
  loginByPhone,
  registerByPhone,
  validateToken,
  getUserByToken,
  JWT_SECRET,
};
