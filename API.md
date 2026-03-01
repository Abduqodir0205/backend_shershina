# Backend API — barcha endpointlar

Baza URL: `http://localhost:4000/api` (yoki `process.env.PORT`).

**Autentifikatsiya:**  
Ochiq: faqat `/api/auth/*`.  
Qolgan barcha `/api/*` endpointlar **JWT** talab qiladi: `Authorization: Bearer <token>`.

**Rollar:**  
`/api/inventory/*` va `/api/reports/*` faqat **ADMIN** rolida ishlaydi.

---

## 1. Auth (ochiq — token kerak emas)

### POST `/api/auth/login`

**Kutiladi (body, JSON):**
```json
{
  "phone": "901234567",
  "password": "parol123"
}
```

**Muvaffaqiyat (200):**
```json
{
  "user": {
    "id": 1,
    "phone": "901234567",
    "firstName": "...",
    "lastName": "...",
    "role": "USER",
    "shopId": 1,
    "shop": { "id": 1, "name": "..." }
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```
(`user` ichida `passwordHash` bo‘lmaydi.)

**Xato:**
- **401** — `{ "error": "Telefon yoki parol noto'g'ri", "code": "INVALID_CREDENTIALS" }`

---

### POST `/api/auth/register`

**Kutiladi (body, JSON):**
```json
{
  "phone": "901234567",
  "password": "parol123",
  "firstName": "Ism",
  "lastName": "Familiya"
}
```
`firstName` va `lastName` ixtiyoriy.

**Muvaffaqiyat (201):**
```json
{
  "user": { "id": 1, "phone": "...", "firstName": "...", "lastName": "...", "role": "USER", "shop": null },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Xato:**
- **409** — `{ "error": "Bu telefon allaqachon ro'yxatdan o'tgan", "code": "PHONE_EXISTS" }`

---

## 2. Users (JWT kerak)

### GET `/api/users/me`

**Header:** `Authorization: Bearer <token>`

**Kutiladi:** hech narsa (query/body yo‘q).

**Muvaffaqiyat (200):** joriy foydalanuvchi obyekti (passwordHash siz), masalan:
```json
{
  "id": 1,
  "phone": "901234567",
  "firstName": "...",
  "lastName": "...",
  "role": "USER",
  "shopId": 1,
  "shop": { "id": 1, "name": "..." }
}
```

**Xato:**
- **401** — `{ "error": "Foydalanuvchi topilmadi", "code": "UNAUTHORIZED" }`  
- **401** — token yo‘q/noto‘g‘ri: `{ "error": "Token talab qilinadi", "code": "UNAUTHORIZED" }` yoki `{ "error": "Token yaroqsiz yoki muddati tugagan", "code": "INVALID_TOKEN" }`

---

## 3. Shops (JWT kerak)

### GET `/api/shops`

**Kutiladi:** hech narsa.

**Jo‘natadi (200):** do‘konlar ro‘yxati:
```json
[
  {
    "id": 1,
    "name": "Do'kon 1",
    "location": null,
    "phone": null,
    "latitude": null,
    "longitude": null,
    "createdAt": "..."
  }
]
```

---

### GET `/api/shops/:id`

**Kutiladi:** URL da `id` (do‘kon ID, butun son).

**Muvaffaqiyat (200):** bitta do‘kon obyekti (to‘liq).

**Xato:**
- **400** — `{ "error": "Noto'g'ri do'kon ID", "code": "INVALID_ID" }`
- **404** — `{ "error": "Do'kon topilmadi", "code": "NOT_FOUND" }`

---

## 4. Inventory (JWT + ADMIN)

Barcha endpointlarda **query** da ixtiyoriy `shopId` berish mumkin; bo‘lmasa `req.user.shopId` yoki `DEFAULT_SHOP_ID` (1) ishlatiladi.

### GET `/api/inventory/summary`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "shopId": 1,
  "newTires": { "totalQuantity": 10, "items": [ { "id", "brand", "size", "quantity", "priceBuy", "priceSell" } ] },
  "usedTires": { "totalQuantity": 5, "items": [ { "id", "size", "condition", "quantity", "priceBuy", "priceSell" } ] },
  "rabochiyBalon": { "totalQuantity": 3, "items": [ { "id", "razmer", "balonTuri", "soni", "narx", "holat" } ] }
}
```

---

### GET `/api/inventory/new`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "totalQuantity": 10,
  "items": [
    { "id": 1, "brand": "...", "size": "...", "quantity": 5, "priceBuy": 1000, "priceSell": 1200 }
  ]
}
```

---

### GET `/api/inventory/used`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "totalQuantity": 5,
  "items": [
    { "id": 1, "size": "...", "condition": "...", "quantity": 2, "priceBuy": 500, "priceSell": 700 }
  ]
}
```

---

### GET `/api/inventory/rabochiy`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "totalQuantity": 3,
  "items": [
    { "id": 1, "razmer": "...", "balonTuri": "...", "soni": 1, "narx": 50, "holat": "yaxshi" }
  ]
}
```

---

## 5. Reports (JWT + ADMIN)

`shopId` yana query yoki user/shop orqali; sana oralig‘i bo‘lsa query da.

### GET `/api/reports/inventory`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "shopId": 1,
  "skladRows": [
    { "razmer", "balon_turi", "kirdi", "sotildi", "qoldiq", "tan_narx", "sotish_narx" }
  ],
  "fullSummary": { "shopId", "newTires", "usedTires", "rabochiyBalon" },
  "rabOmbor": { "soni": 10, "summa": 500 }
}
```

---

### GET `/api/reports/sales`

**Kutiladi:** query:
- `shopId` (ixtiyoriy)
- `startDate` (ixtiyoriy, masalan `2025-01-01`)
- `endDate` (ixtiyoriy, masalan `2025-01-31`)

**Jo‘natadi (200):**
```json
{
  "shopId": 1,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "chiqimRows": [ ... ],
  "rabSotuvRows": [ ... ],
  "chiqimTotals": { "sum", "foyda", "naqd_foyda", "zaxira_foyda", "sotildi" }
}
```

---

### GET `/api/reports/dashboard`

**Kutiladi:** query: `shopId` (ixtiyoriy).

**Jo‘natadi (200):**
```json
{
  "shopId": 1,
  "chiqimTotals": { "sum", "foyda", "naqd_foyda", "zaxira_foyda", "sotildi" },
  "rabOmbor": { "soni": 10, "summa": 500 },
  "skladInvestitsiya": 1000000,
  "kutilayotganFoyda": 200000
}
```

---

## Umumiy xatolar

- **404** — `{ "error": "Endpoint topilmadi", "path": "/api/..." }`
- **500** — `{ "error": "Server xatosi", "code": "INTERNAL_ERROR" }`

---

## Qisqacha jadval

| Method | Endpoint | Auth | Rol | Body/Query |
|--------|----------|------|-----|------------|
| POST | `/api/auth/login` | — | — | body: `phone`, `password` |
| POST | `/api/auth/register` | — | — | body: `phone`, `password`, `firstName?`, `lastName?` |
| GET | `/api/users/me` | JWT | — | — |
| GET | `/api/shops` | JWT | — | — |
| GET | `/api/shops/:id` | JWT | — | URL: `id` |
| GET | `/api/inventory/summary` | JWT | ADMIN | query: `shopId?` |
| GET | `/api/inventory/new` | JWT | ADMIN | query: `shopId?` |
| GET | `/api/inventory/used` | JWT | ADMIN | query: `shopId?` |
| GET | `/api/inventory/rabochiy` | JWT | ADMIN | query: `shopId?` |
| GET | `/api/reports/inventory` | JWT | ADMIN | query: `shopId?` |
| GET | `/api/reports/sales` | JWT | ADMIN | query: `shopId?`, `startDate?`, `endDate?` |
| GET | `/api/reports/dashboard` | JWT | ADMIN | query: `shopId?` |
