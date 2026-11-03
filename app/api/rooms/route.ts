import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomInt } from "crypto";
import { getServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentInput {
  agent_name: string;
  persona: string;
}

const ROOM_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Kode room format XXX-### (mis. PWK-515): 3 huruf + strip + 3 angka.
 * Unik via UNIQUE constraint di DB; tabrakan ditangani retry di caller.
 */
function generateRoomCode(): string {
  const letters = Array.from(
    { length: 3 },
    () => ROOM_CODE_ALPHABET[randomInt(0, 26)]
  ).join("");
  const digits = String(randomInt(0, 1000)).padStart(3, "0");
  return `${letters}-${digits}`;
}

/**
 * POST /api/rooms — buat room (FR-01): topik, persona agen, max_rounds.
 * Menghasilkan Room ID + room_code `XXX-###` (mis. PWK-515) + API Key
 * `syn_live_<32 hex>` (FR-02). API key hanya dikembalikan SEKALI di response ini.
 */
export async function POST(req: NextRequest) {
  let body: {
    topic?: string;
    max_rounds?: number;
    agents?: AgentInput[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const topic = body.topic?.trim();
  const agents = Array.isArray(body.agents) ? body.agents : [];
  const maxRounds =
    typeof body.max_rounds === "number" && body.max_rounds > 0
      ? Math.floor(body.max_rounds)
      : 5;

  if (!topic) {
    return NextResponse.json({ error: "Field 'topic' wajib diisi." }, { status: 400 });
  }
  if (agents.length === 0 || agents.some((a) => !a.agent_name?.trim())) {
    return NextResponse.json(
      { error: "Minimal satu agen dengan 'agent_name' wajib diisi." },
      { status: 400 }
    );
  }

  const api_key = `syn_live_${randomBytes(16).toString("hex")}`; // syn_live_ + 32 hex
  const supabase = getServiceClient();

  // room_code: 3 huruf + 3 angka dipisah strip (mis. PWK-515). Generated di sini
  // (trust boundary server-side). UNIQUE constraint nangkep tabrakan; retry max 5x.
  let roomErr: { message: string } | null = null;
  let room: Record<string, unknown> | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({ topic, max_rounds: maxRounds, room_code: generateRoomCode() })
      .select("id, room_code, topic, status, max_rounds, current_round, created_at")
      .single();
    if (!error) {
      room = data;
      roomErr = null;
      break;
    }
    // 23505 = unique_violation: kode tabrakan, coba kode lain. Error lain = gagal beneran.
    roomErr = error;
    if (error.code !== "23505") break;
  }
  if (roomErr || !room) {
    return NextResponse.json(
      { error: `Gagal membuat room: ${roomErr?.message}` },
      { status: 500 }
    );
  }

  const { error: agentsErr } = await supabase.from("room_agents").insert(
    agents.map((a) => ({
      room_id: room.id,
      agent_name: a.agent_name.trim(),
      persona: a.persona?.trim() || "unspecified",
    }))
  );
  if (agentsErr) {
    return NextResponse.json(
      { error: `Room dibuat tapi gagal daftar agen: ${agentsErr.message}` },
      { status: 500 }
    );
  }

  const { error: secretErr } = await supabase
    .from("room_secrets")
    .insert({ room_id: room.id, api_key });
  if (secretErr) {
    await supabase.from("rooms").delete().eq("id", room.id);
    return NextResponse.json(
      { error: `Gagal menyimpan API key: ${secretErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ room, api_key }, { status: 201 });
}
