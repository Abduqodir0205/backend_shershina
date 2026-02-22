# SherShina Backend (REST API)

Mobil ilova va hisobotlar uchun alohida deploy qilinadigan API. Bot (`telegram_bot/`) bilan bir xil PostgreSQL bazasidan foydalanadi.

## Oʻrnatish

```bash
cd backend
npm install
cp .env.example .env
# .env da DATABASE_URL, JWT_SECRET ni toʻldiring
npx prisma generate
```

## Ishga tushirish

```bash
npm start
```

Default port: 4000 (`PORT` env orqali oʻzgartirish mumkin).

## Endpointlar

- `GET /` — API ishlayapti
- `GET /health` — health check
- `POST /api/auth/login` — login (phone, password)
- `POST /api/auth/register` — roʻyxatdan oʻtish
- `GET /api/users/me` — JWT: joriy user
- `GET /api/shops` — JWT: doʻkonlar roʻyxati
- `GET /api/shops/:id` — JWT: bitta doʻkon
- `GET /api/inventory/summary|new|used|rabochiy` — JWT + ADMIN, ?shopId=1
- `GET /api/reports/inventory|sales|dashboard` — JWT + ADMIN, ?shopId=1&startDate=&endDate=

## Alohida deploy

Backend ni Render, Railway, Fly.io va h.k. ga alohida deploy qiling. `DATABASE_URL` bot bilan bir xil bazaga yoʻnaltiring (yoki alohida DB). `JWT_SECRET` va `ADMIN_IDS` ni sozlang.
