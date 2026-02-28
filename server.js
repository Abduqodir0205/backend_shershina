/**
 * SherShina Backend — REST API (alohida deploy).
 * Mobil ilova va Flutter web: CORS yoqilgan.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./src/api');
const { connectDatabase } = require('./src/utils/database');

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'http://localhost:9090',
  'http://localhost:8081',
  'http://127.0.0.1:9090',
  'http://127.0.0.1:8081',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, origin);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use('/api', apiRouter);
app.get('/', (req, res) => res.send('SherShina API is running'));
app.get('/health', (req, res) => res.json({ ok: true }));

async function main() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Backend start error:', err);
  process.exit(1);
});
