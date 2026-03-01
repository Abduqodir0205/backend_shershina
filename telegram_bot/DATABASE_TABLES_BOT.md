# Telegram bot — qaysi jadvalga saqlaydi / o‘qiydi

Bot va backend (mobile API) **bir xil PostgreSQL bazasi** va **shu jadval nomlari** bilan ishlashi kerak. Mobile’da kiritilgan ma’lumotlar botda, botda kiritilganlari mobileda ko‘rinadi.

## Asosiy jadvalar

| Ma’lumot           | Bazadagi jadval nomi | Bot ishlatadi     |
|--------------------|------------------------|-------------------|
| Kirim (yangi shina)| `tires`                | Saqlaydi + o‘qiydi |
| Sotuv (chiqim)     | `sales`                | Saqlaydi + o‘qiydi |
| Ishchi shinalar    | `used_tires`           | Saqlaydi + o‘qiydi |
| Rabochiy balon     | `rabochiy_balon`       | Saqlaydi + o‘qiydi |
| Rabochiy sotuv     | `rabochiy_sotuv`       | Saqlaydi + o‘qiydi |
| Olinish kerak      | `olinish_kerak`        | Saqlaydi + o‘qiydi |
| Razmerlar          | `sizes`                | Kirimda upsert     |
| Brendlar           | `brands`               | Kirimda upsert     |
| Do‘konlar          | `shops`, `shop_settings`, `shop_admins` | Ha |
| Ombor logi         | `warehouse_logs`       | Kirim/chiqimda     |

Bot va backend **bitta PostgreSQL bazasida** shu jadval nomlari bilan ishlaydi. Agar backend boshqa jadvalga yozsa yoki boshqa bazaga ulansa, ma’lumotlar uchrashmaydi.

## Nima qilsangiz yaxshi bo‘ladi

1. **Backend ham shu jadvallardan foydalansin**  
   Mobile API kirim/sotuv/o‘qish uchun `tires`, `sales`, `used_tires`, `rabochiy_balon`, `rabochiy_sotuv`, `olinish_kerak` va boshqa jadvalarni ishlatsin. Yangi nomli jadval (masalan, `inventory`, `orders`) ochib faqat mobile uchun yozilsa, bot boshqa jadvalga yozgani uchun ma’lumot “chalkashib” ketadi.

2. **Bir xil DATABASE_URL**  
   Telegram bot va backend bir xil bazaga ulanishi kerak (bir xil `.env` dagi `DATABASE_URL`). URL har xil bo‘lsa, ikkita baza bo‘ladi.

3. **Sotuvlar faqat `sales` da**  
   Sotuv yozish va o‘qish `sales` jadvalidan bo‘lishi kerak. Backend sotuvni boshqa jadvalga yozmasin.

## sales jadvali — ikki format

- **Legacy (bot):** `razmer`, `balon_turi`, `sotildi`, `umumiy_qiymat`, `foyda`, `naqd_foyda`, `zaxira_foyda`, `rabochiy_olindi`, `rabochiy_narxi` va hokazo.
- **Yangi (mobile/backend):** `item_type`, `tire_id` / `used_tire_id`, `quantity`, `total_price`, `admin_id`.

Prisma schema va backend API ikkala formatni qo‘llab-quvvatlaydi; bitta `sales` jadvalida ikkala turdagi yozuvlar bo‘lishi mumkin.

## Xulosa

Bot `tires` (kirim), `sales` (sotuv) va yuqoridagi boshqa jadvallarga yozadi/o‘qiydi. Backend va mobile shu jadvallardan va shu bazadan foydalansa, bot va ilova bir xil ma’lumotni ko‘radi; chalkashlik kamayadi.
