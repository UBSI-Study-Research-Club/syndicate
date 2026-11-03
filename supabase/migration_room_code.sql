-- ============================================================
-- Migration: room_code (join room via kode, mis. PWK-515)
-- Jalankan di Supabase Dashboard > SQL Editor
-- Idempotent: aman dijalankan ulang
-- ============================================================

-- Tambah kolom kalau belum ada
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_code TEXT;

-- Backfill room lama dengan kode format-compliant + retry tabrakan.
-- (random() antar baris dalam satu statement nggak dijamin beda, jadi loop per baris)
DO $$
DECLARE
  r RECORD;
  code TEXT;
BEGIN
  FOR r IN SELECT id FROM rooms WHERE room_code IS NULL LOOP
    LOOP
      code :=
        chr(65 + floor(random() * 26)::int)
        || chr(65 + floor(random() * 26)::int)
        || chr(65 + floor(random() * 26)::int)
        || '-'
        || lpad(floor(random() * 1000)::int::text, 3, '0');
      BEGIN
        UPDATE rooms SET room_code = code WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- tabrakan kode: retry dengan kode baru
      END;
    END LOOP;
  END LOOP;
END $$;

-- Format WAJIB 3 huruf - 3 angka (divalidasi dua lapis: DB source of truth,
-- API sebagai UX/error message). DROP dulu biar idempotent.
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_room_code_format;
ALTER TABLE rooms
  ADD CONSTRAINT rooms_room_code_format CHECK (room_code ~ '^[A-Z]{3}-[0-9]{3}$');

ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_room_code_key;
ALTER TABLE rooms ADD CONSTRAINT rooms_room_code_key UNIQUE (room_code);

-- Catatan: UNIQUE (room_code) di atas udah bikin index btree otomatis buat lookup.
-- Catatan: rooms sudah punya policy "public read rooms" (SELECT USING true)
-- di schema.sql, jadi anon bisa lookup room_code tanpa policy tambahan.
