import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOM_CODE_RE = /^[A-Z]{3}-[0-9]{3}$/;

/**
 * POST /api/rooms/join — lookup room by kode (mis. "PWK-515").
 * Body: { code: string } → { room_id } | 404 kalau kode nggak ketemu.
 * Normalisasi: trim + uppercase, biar "pwk-515" / " pwk-515 " tetap lolos.
 */
export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase() ?? "";
  if (!code) {
    return NextResponse.json({ error: "Field 'code' wajib diisi." }, { status: 400 });
  }
  if (!ROOM_CODE_RE.test(code)) {
    return NextResponse.json(
      { error: "Format kode salah. Pakai format 3 huruf - 3 angka, mis. PWK-515." },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("room_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Gagal mencari room: ${error.message}` },
      { status: 500 }
    );
  }
  if (!room) {
    return NextResponse.json(
      { error: "Room tidak ditemukan. Cek lagi kode room-nya." },
      { status: 404 }
    );
  }

  return NextResponse.json({ room_id: room.id });
}
