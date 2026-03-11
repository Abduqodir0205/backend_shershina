# SherShina Backend API

Barcha endpointlar `BASE_URL/api` ostida. Masalan: `http://localhost:4000/api`.

---

## Autentifikatsiya

| Endpoint | Auth |
|----------|------|
| `POST /api/auth/login`, `POST /api/auth/register` | Yo‘q (ochiq) |
| `/api/users/*`, `/api/shops/*` | JWT (Bearer token) |
| `/api/inventory/*`, `/api/reports/*` | JWT + rol ADMIN yoki SELLER |

Protected so‘rovlarda header: `Authorization: Bearer <token>`.

---

## 1. Auth — `/api/auth`

### POST /api/auth/login

**Qabul qiladi (body, JSON):**

| Maydon     | Turi   | Majburiy | Tavsif        |
|------------|--------|----------|---------------|
| `phone`    | string | Ha       | Telefon raqam |
| `password` | string | Ha       | Parol        |

**Muvaffaqiyat (200):**

```json
{
  "user": {
    "id": 1,
    "telegramId": null,
    "firstName": "Ism",
    "lastName": "Familiya",
    "username": null,
    "role": "ADMIN",
    "shopId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "phone": "+998901234567",
    "shop": { "id": 1, "name": "Do'kon 1", "location": null, "phone": null, "latitude": null, "longitude": null, "createdAt": "...", "updatedAt": "..." },
    "roleDisplayName": "Admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Xato:** `401` — `{ "error": "Telefon yoki parol noto'g'ri", "code": "INVALID_CREDENTIALS" }`

---

### POST /api/auth/register

**Qabul qiladi (body, JSON):**

| Maydon      | Turi   | Majburiy | Tavsif        |
|-------------|--------|----------|---------------|
| `phone`     | string | Ha       | Telefon raqam |
| `password`  | string | Ha       | Parol         |
| `firstName` | string | Yo‘q     | Ism           |
| `lastName`  | string | Yo‘q     | Familiya      |

**Muvaffaqiyat (201):** Login kabi — `{ "user": {...}, "token": "..." }`. Yangi user `role: "USER"`, `roleDisplayName: "Foydalanuvchi"`.

**Xato:** `409` — `{ "error": "Bu telefon allaqachon ro'yxatdan o'tgan", "code": "PHONE_EXISTS" }`

---

## 2. Users — `/api/users` (JWT)

### GET /api/users/me

**Qabul qiladi:** Hech narsa (foydalanuvchi JWT dan aniqlanadi).

**Qaytaradi (200):**

```json
{
  "id": 1,
  "telegramId": null,
  "firstName": "Ism",
  "lastName": "Familiya",
  "username": null,
  "role": "SELLER",
  "shopId": 1,
  "createdAt": "...",
  "updatedAt": "...",
  "phone": "+998901234567",
  "shop": { "id": 1, "name": "...", "location": null, "phone": null, "latitude": null, "longitude": null, "createdAt": "...", "updatedAt": "..." },
  "roleDisplayName": "Sotuvchi"
}
```

`roleDisplayName`: USER → "Foydalanuvchi", ADMIN → "Admin", SELLER → "Sotuvchi".

**Xato:** `401` — `{ "error": "Foydalanuvchi topilmadi", "code": "UNAUTHORIZED" }`

---

## 3. Shops — `/api/shops` (JWT)

### GET /api/shops

**Qabul qiladi:** Query parametr yo‘q.

**Qaytaradi (200):** Do‘konlar ro‘yxati (id, name, location, phone, latitude, longitude, createdAt).

```json
[
  {
    "id": 1,
    "name": "Do'kon 1",
    "location": "Toshkent",
    "phone": null,
    "latitude": null,
    "longitude": null,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### GET /api/shops/:id

**Qabul qiladi:** URL da `id` — do‘kon ID (integer).

**Qaytaradi (200):** Bitta do‘kon (to‘liq model: id, name, location, phone, latitude, longitude, createdAt, updatedAt).

**Xato:** `400` — `{ "error": "Noto'g'ri do'kon ID", "code": "INVALID_ID" }`  
**Xato:** `404` — `{ "error": "Do'kon topilmadi", "code": "NOT_FOUND" }`

---

## 4. Inventory — `/api/inventory` (JWT + ADMIN yoki SELLER)

SELLER uchun do‘kon faqat `user.shopId`; ADMIN uchun `?shopId=` ixtiyoriy.

**Query (ADMIN uchun):** `shopId` — ixtiyoriy, do‘kon ID (SELLER da e’tiborsiz).

---

### GET /api/inventory/summary

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):**

```json
{
  "shopId": 1,
  "newTires": { "totalQuantity": 100, "items": [{ "id": 1, "brand": "Brend", "size": "205/55 R16", "quantity": 10, "priceBuy": 500000, "priceSell": 600000 }] },
  "usedTires": { "totalQuantity": 20, "items": [{ "id": 1, "size": "205/55 R16", "condition": "GOOD", "quantity": 5, "priceBuy": 200000, "priceSell": 250000 }] },
  "rabochiyBalon": { "totalQuantity": 15, "items": [{ "id": 1, "razmer": "R13", "balonTuri": "Yangi", "soni": 3, "narx": 50000, "holat": "yaxshi" }] }
}
```

---

### GET /api/inventory/new

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):** `{ "totalQuantity": number, "items": Array<{ id, brand, size, quantity, priceBuy, priceSell }> }`

---

### GET /api/inventory/used

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):** `{ "totalQuantity": number, "items": Array<{ id, size, condition, quantity, priceBuy, priceSell }> }`

---

### GET /api/inventory/rabochiy

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):** `{ "totalQuantity": number, "items": Array<{ id, razmer, balonTuri, soni, narx, holat }> }`

---

### POST /api/inventory/add

Yangi shina kirimini qo‘shish (yoki mavjud qator `quantity` sini oshirish) — `tires` (`Kirim`) jadvaliga yozadi.  
SELLER uchun `shopId` avtomatik `user.shopId`; ADMIN uchun body ichida `shopId` berilishi mumkin.

**Qabul qiladi (body, JSON):**

| Maydon      | Turi   | Majburiy | Tavsif                                        |
|-------------|--------|----------|-----------------------------------------------|
| `brand`     | string | Ha       | Brend nomi (`balon_turi`)                    |
| `size`      | string | Ha       | Razmer (masalan, `"205/55 R16"`)             |
| `quantity`  | number | Ha       | Dona (musbat butun son)                      |
| `priceBuy`  | number | Yo‘q     | Kelgan narx, 1 dona uchun (so‘m)             |
| `priceSell` | number | Yo‘q     | Sotish narx, 1 dona uchun (so‘m); berilmasa `>= priceBuy` qilib avtomatik olinadi |
| `shopId`    | number | Yo‘q     | Faqat ADMIN uchun ixtiyoriy, do‘kon ID       |

**Muvaffaqiyat (201):**

```json
{
  "id": 1,
  "shopId": 1,
  "brand": "Bridgestone",
  "size": "205/55 R16",
  "priceBuy": 500000,
  "priceSell": 600000,
  "quantity": 15,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Xatolar (namuna):**

- `400` — `{ "error": "brand, size va quantity majburiy", "code": "INVALID_PAYLOAD" }`
- `400` — `{ "error": "quantity musbat butun son bo'lishi kerak", "code": "INVALID_QUANTITY" }`

---

## 5. Reports — `/api/reports` (JWT + ADMIN yoki SELLER)

**Query:** `shopId` — ixtiyoriy (ADMIN); SELLER uchun faqat o‘z do‘koni.

---

### GET /api/reports/inventory

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):**

```json
{
  "shopId": 1,
  "skladRows": [
    { "razmer": "205/55 R16", "balon_turi": "Brend", "kirdi": 50, "sotildi": 10, "qoldiq": 40, "tan_narx": 500000, "sotish_narx": 600000 }
  ],
  "fullSummary": { "shopId": 1, "newTires": {...}, "usedTires": {...}, "rabochiyBalon": {...} },
  "rabOmbor": { "soni": 15, "summa": 750000 }
}
```

---

### GET /api/reports/sales

**Qabul qiladi:**  
- `shopId` (query, ixtiyoriy)  
- `startDate` (query, ixtiyoriy) — `YYYY-MM-DD`, default bugun  
- `endDate` (query, ixtiyoriy) — `YYYY-MM-DD`, default bugun  

**Qaytaradi (200):**

```json
{
  "shopId": 1,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "chiqimRows": [
    { "id": 1, "itemType": "NEW", "tireId": 1, "usedTireId": null, "quantity": 2, "totalPrice": 1200000, "adminId": 1, "shopId": 1, "createdAt": "...", "kirim": {...}, "usedTire": null }
  ],
  "rabSotuvRows": [
    { "id": 1, "razmer": "R13", "balonTuri": "Yangi", "olinganNarx": 50000, "sotilganNarx": 60000, "sana": "...", "shopId": 1 }
  ],
  "chiqimTotals": { "sum": 5000000, "foyda": 5000000, "naqd_foyda": 0, "zaxira_foyda": 0, "sotildi": 25 }
}
```

---

### GET /api/reports/dashboard

**Qabul qiladi:** `shopId` (query, ixtiyoriy).

**Qaytaradi (200):**

```json
{
  "shopId": 1,
  "chiqimTotals": { "sum": 5000000, "foyda": 5000000, "naqd_foyda": 0, "zaxira_foyda": 0, "sotildi": 25 },
  "rabOmbor": { "soni": 15, "summa": 750000 },
  "skladInvestitsiya": 20000000,
  "kutilayotganFoyda": 3000000
}
```

---

## 6. Sales — `/api/sales` (JWT + ADMIN yoki SELLER)

Yangi sotuv (chiqim) yozuvi: `sales` jadvaliga yozadi, `tires` stokini kamaytiradi va ixtiyoriy trade-in bo‘lsa `rabochiy_balon` ga yozadi.  
SELLER uchun do‘kon faqat `user.shopId`; ADMIN uchun `shopId` body orqali berilishi mumkin.

### POST /api/sales

**Qabul qiladi (body, JSON):**

| Maydon               | Turi    | Majburiy | Tavsif |
|----------------------|---------|----------|--------|
| `tireId`             | number  | Ha       | Sotilayotgan yangi shina (`Kirim`) ID si |
| `quantity`           | number  | Ha       | Sotilgan dona (musbat butun son)         |
| `totalPrice`         | number  | Ha       | Jami sotuv summasi (so‘m, naqd + trade-in qiymati) |
| `shopId`             | number  | Yo‘q     | Faqat ADMIN uchun ixtiyoriy, do‘kon ID   |
| `tradeIn`            | object  | Yo‘q     | Agar mijoz eski balonni tashlab ketayotgan bo‘lsa, trade-in ma’lumotlari |
| `tradeIn.count`      | number  | Yo‘q     | Qabul qilingan rabochiy balonlar soni (odatda 0 yoki 1) |
| `tradeIn.price`      | number  | Yo‘q     | Bitta rabochiy balon uchun qabul narxi (so‘m) |
| `tradeIn.size`       | string  | Yo‘q     | Eski balon razmeri (default: sotilgan razmer) |
| `tradeIn.brand`      | string  | Yo‘q     | Eski balon turi (default: sotilgan brend) |
| `tradeIn.condition`  | string  | Yo‘q     | Holat (`"yaxshi"` default)                |

**Muvaffaqiyat (201):**

```json
{
  "shopId": 1,
  "tireId": 10,
  "quantity": 2,
  "totalPrice": 1200000,
  "naqdFoyda": 200000,
  "zaxiraFoyda": 50000,
  "foyda": 250000,
  "chiqim": {
    "id": 123,
    "itemType": "NEW",
    "tireId": 10,
    "quantity": 2,
    "totalPrice": 1200000,
    "shopId": 1,
    "razmer": "205/55 R16",
    "balonTuri": "Bridgestone",
    "sotildi": 2,
    "umumiyQiymat": 1200000,
    "foyda": 250000,
    "naqdFoyda": 200000,
    "zaxiraFoyda": 50000,
    "rabochiyOlindi": 1,
    "rabochiyNarxi": 50000,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "updatedTire": {
    "id": 10,
    "shopId": 1,
    "brand": "Bridgestone",
    "size": "205/55 R16",
    "priceBuy": 500000,
    "priceSell": 600000,
    "quantity": 8
  },
  "rabochiyIds": [ 5 ]
}
```

**Xatolar (namuna):**

- `400` — `{ "error": "tireId, quantity va totalPrice majburiy", "code": "INVALID_PAYLOAD" }`
- `400` — `{ "error": "quantity musbat butun son bo'lishi kerak", "code": "INVALID_QUANTITY" }`
- `400` — `{ "error": "totalPrice musbat son bo'lishi kerak", "code": "INVALID_TOTAL_PRICE" }`
- `400` — `{ "error": "Skladda yetarli shina yo'q", "code": "INSUFFICIENT_STOCK" }`
- `404` — `{ "error": "Shina topilmadi yoki boshqa do'konga tegishli", "code": "TIRE_NOT_FOUND" }`

---

## Umumiy xato javoblari

| Kod | Body (namuna) |
|-----|----------------|
| 401 | `{ "error": "Token talab qilinadi", "code": "UNAUTHORIZED" }` yoki `"Token yaroqsiz yoki muddati tugagan", "code": "INVALID_TOKEN"` |
| 403 | `{ "error": "Bu bo'limga kirish huquqingiz yo'q", "code": "FORBIDDEN" }` — USER inventory/reports ga kira olmaydi |
| 404 | `{ "error": "Endpoint topilmadi", "path": "/api/..." }` |
| 500 | `{ "error": "Server xatosi", "code": "INTERNAL_ERROR" }` |

---

## Qisqacha endpointlar jadvali

| Method | Path | Auth | Body/Query | Qaytaradi |
|--------|------|------|------------|-----------|
| POST | /api/auth/login | — | body: phone, password | user, token |
| POST | /api/auth/register | — | body: phone, password, firstName?, lastName? | user, token |
| GET | /api/users/me | JWT | — | user (roleDisplayName bilan) |
| GET | /api/shops | JWT | — | shops[] |
| GET | /api/shops/:id | JWT | — | shop |
| GET | /api/inventory/summary | JWT, ADMIN/SELLER | ?shopId | newTires, usedTires, rabochiyBalon |
| GET | /api/inventory/new | JWT, ADMIN/SELLER | ?shopId | totalQuantity, items |
| GET | /api/inventory/used | JWT, ADMIN/SELLER | ?shopId | totalQuantity, items |
| GET | /api/inventory/rabochiy | JWT, ADMIN/SELLER | ?shopId | totalQuantity, items |
| POST | /api/inventory/add | JWT, ADMIN/SELLER | body: brand, size, quantity, priceBuy?, priceSell?, shopId? (ADMIN) | Yangi/yoki yangilangan Kirim (tires) yozuvi |
| GET | /api/reports/inventory | JWT, ADMIN/SELLER | ?shopId | shopId, skladRows, fullSummary, rabOmbor |
| GET | /api/reports/sales | JWT, ADMIN/SELLER | ?shopId, ?startDate, ?endDate | shopId, chiqimRows, rabSotuvRows, chiqimTotals |
| GET | /api/reports/dashboard | JWT, ADMIN/SELLER | ?shopId | shopId, chiqimTotals, rabOmbor, skladInvestitsiya, kutilayotganFoyda |
| POST | /api/sales | JWT, ADMIN/SELLER | body: tireId, quantity, totalPrice, tradeIn?, shopId? (ADMIN) | Sotuv natijasi (chiqim, updatedTire, rabochiyIds) |
