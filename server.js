/**
 * SherShina Backend — REST API (alohida deploy).
 * Mobil ilova: /api/auth, /api/shops, /api/inventory, /api/reports.
 */
require('dotenv').config();
const express = require('express');
const apiRouter = require('./src/api');
const { connectDatabase } = require('./src/utils/database');

const app = express();
const PORT = process.env.PORT || 4000;

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
