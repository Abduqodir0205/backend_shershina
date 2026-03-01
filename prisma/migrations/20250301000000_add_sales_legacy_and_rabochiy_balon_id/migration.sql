-- Sales jadvaliga legacy ustunlar (bot va backend bir xil sales dan foydalashi uchun).
-- Agar ustunlar allaqachon mavjud bo'lsa (bot yaratgan bo'lsa), IF NOT EXISTS tufayli xato bermaydi.
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "razmer" TEXT;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "balon_turi" TEXT;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "sotildi" INTEGER;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "umumiy_qiymat" DOUBLE PRECISION;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "foyda" DOUBLE PRECISION;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "naqd_foyda" DOUBLE PRECISION;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "zaxira_foyda" DOUBLE PRECISION;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "rabochiy_olindi" INTEGER;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "rabochiy_narxi" DOUBLE PRECISION;

-- Yangi va legacy format bir jadvalda: item_type, quantity, total_price, admin_id ixtiyoriy (ustun mavjud bo'lsa).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='item_type') THEN
    ALTER TABLE "sales" ALTER COLUMN "item_type" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='quantity') THEN
    ALTER TABLE "sales" ALTER COLUMN "quantity" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='total_price') THEN
    ALTER TABLE "sales" ALTER COLUMN "total_price" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='admin_id') THEN
    ALTER TABLE "sales" ALTER COLUMN "admin_id" DROP NOT NULL;
  END IF;
END $$;

-- rabochiy_sotuv: qaysi balon sotilgani (legacy saveRabochiySotuv uchun).
ALTER TABLE "rabochiy_sotuv" ADD COLUMN IF NOT EXISTS "rabochiy_balon_id" INTEGER;
