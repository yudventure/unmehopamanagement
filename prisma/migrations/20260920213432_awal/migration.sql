-- btree_gist memberi gist kemampuan membandingkan tipe skalar biasa dengan `=`.
-- Tanpa itu, EXCLUDE di bawah tidak bisa menyebut room_id sama sekali.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('BOOKING_COM', 'TRAVELOKA', 'AGODA', 'WHATSAPP', 'WALK_IN', 'BLOCK');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('TENTATIVE', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'CONFLICT', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('MANUAL', 'ICAL');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('DEPOSIT', 'BALANCE', 'EXTRA', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH', 'EWALLET', 'OTA_PREPAID');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "FeedDirection" AS ENUM ('IMPORT', 'EXPORT');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "island" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room_type" TEXT,
    "cap_adult" INTEGER NOT NULL DEFAULT 2,
    "cap_child" INTEGER NOT NULL DEFAULT 0,
    "base_rate" DECIMAL(14,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_reason" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_rates" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "rate" DECIMAL(14,2) NOT NULL,
    "label" TEXT,

    CONSTRAINT "seasonal_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "origin" TEXT,
    "notes" TEXT,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "guest_id" TEXT,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    -- Dihitung database, bukan ditulis aplikasi. Setengah terbuka: tamu keluar
    -- pada tanggal check-out, jadi kamar bisa langsung dipakai tamu lain hari
    -- itu — konvensi yang sama dengan DTEND di iCal.
    "stay" daterange GENERATED ALWAYS AS (daterange("check_in", "check_out", '[)')) STORED,
    "channel" "Channel" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'TENTATIVE',
    "source" "BookingSource" NOT NULL DEFAULT 'MANUAL',
    "external_uid" TEXT,
    "total_amount" DECIMAL(14,2),
    "ota_commission_est" DECIMAL(14,2),
    "notes" TEXT,
    "hold_expires_at" TIMESTAMP(3),
    "conflict_group" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paid_at" DATE NOT NULL,
    "proof_url" TEXT,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ical_feeds" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "direction" "FeedDirection" NOT NULL,
    "url" TEXT,
    "export_token" TEXT,
    "ota_label" TEXT,
    "last_success_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "last_error" TEXT,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ical_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "feed_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "events_seen" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "cancelled_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_properties" (
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,

    CONSTRAINT "user_properties_pkey" PRIMARY KEY ("user_id","property_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "diff_json" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rooms_property_id_sort_order_idx" ON "rooms"("property_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_property_id_name_key" ON "rooms"("property_id", "name");

-- CreateIndex
CREATE INDEX "seasonal_rates_room_id_date_from_idx" ON "seasonal_rates"("room_id", "date_from");

-- CreateIndex
CREATE INDEX "guests_name_idx" ON "guests"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");

-- CreateIndex
CREATE INDEX "bookings_room_id_check_in_idx" ON "bookings"("room_id", "check_in");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_conflict_group_idx" ON "bookings"("conflict_group");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "ical_feeds_export_token_key" ON "ical_feeds"("export_token");

-- CreateIndex
CREATE INDEX "ical_feeds_room_id_idx" ON "ical_feeds"("room_id");

-- CreateIndex
CREATE INDEX "sync_runs_feed_id_started_at_idx" ON "sync_runs"("feed_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_at_idx" ON "audit_log"("at");

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_rates" ADD CONSTRAINT "seasonal_rates_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ical_feeds" ADD CONSTRAINT "ical_feeds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "ical_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_properties" ADD CONSTRAINT "user_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_properties" ADD CONSTRAINT "user_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Proteksi anti-double-booking
--
-- Bagian terpenting dari seluruh skema ini. Memeriksa ketersediaan di kode
-- aplikasi tidak cukup: dua permintaan yang datang bersamaan bisa lolos
-- pemeriksaan yang sama sebelum salah satunya menyimpan. Constraint di bawah
-- membuat database menolak overlap secara mutlak, berapa pun jumlah proses
-- yang berjalan.
--
-- Perhatikan klausa WHERE. TENTATIVE, CANCELLED dan NO_SHOW sengaja
-- dikecualikan: hold sementara boleh berdampingan dengan hold lain, dan
-- booking yang sudah dibatalkan tidak boleh memblokir tanggal. CONFLICT juga
-- di luar, karena justru itulah tempat impor iCal menaruh booking yang
-- ditolak constraint ini — booking itu sudah terjadi di OTA, jadi menolaknya
-- berarti kehilangan data.
--
-- Konsekuensinya: menaikkan TENTATIVE jadi CONFIRMED bisa gagal. Tangani
-- error 23P01 sebagai 409 dengan pesan siap tampil, jangan biarkan jadi 500.
-- ---------------------------------------------------------------------------
ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_no_overlap"
    EXCLUDE USING gist ("room_id" WITH =, "stay" WITH &&)
    WHERE ("status" IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'BLOCKED'));

-- Dua tarif tidak boleh menutupi hari yang sama untuk satu kamar. Rentangnya
-- tertutup di kedua ujung: ini menandai hari kalender, bukan malam menginap.
ALTER TABLE "seasonal_rates"
    ADD CONSTRAINT "seasonal_rates_no_overlap"
    EXCLUDE USING gist ("room_id" WITH =, daterange("date_from", "date_to", '[]') WITH &&);

-- Kalender bulanan adalah query rentang tanggal yang dijalankan berulang.
CREATE INDEX "bookings_stay_idx" ON "bookings" USING gist ("stay");

-- Kunci idempotensi sinkron. Parsial, karena booking manual tidak punya UID
-- dan NULL tidak boleh saling bentrok. Prisma tidak bisa menyatakan indeks
-- unik parsial, jadi baris ini ditulis tangan.
CREATE UNIQUE INDEX "bookings_external_uid_key"
    ON "bookings" ("external_uid") WHERE "external_uid" IS NOT NULL;
