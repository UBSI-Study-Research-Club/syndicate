"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreatedRoomInfo {
  id: string;
  room_code?: string;
  topic: string;
  apiKey: string;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [topic, setTopic] = useState("");
  const [agents, setAgents] = useState([
    { name: "", persona: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<CreatedRoomInfo | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addAgent = () => {
    setAgents([...agents, { name: "", persona: "" }]);
  };

  const removeAgent = (index: number) => {
    setAgents(agents.filter((_, i) => i !== index));
  };

  const updateAgent = (index: number, field: "name" | "persona", value: string) => {
    const updated = [...agents];
    updated[index][field] = value;
    setAgents(updated);
  };

  const handleClose = () => {
    setCreatedRoom(null);
    setErrorMsg(null);
    setTopic("");
    setAgents([{ name: "", persona: "" }]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          agents: agents.filter((a) => a.name && a.persona).map((a) => ({ agent_name: a.name, persona: a.persona })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat war room");
      }

      const data = await res.json();
      setCreatedRoom({
        id: data.room.id,
        room_code: data.room.room_code,
        topic: data.room.topic,
        apiKey: data.api_key,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat membuat room");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: "key" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  if (createdRoom) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="ROOM CREDENTIALS">
        <div className="space-y-4 font-mono">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-sm">
            <p className="text-xs text-emerald-400 font-bold mb-1">
              ✓ WAR ROOM BERHASIL DIBUAT
            </p>
            <p className="text-xs text-syndicate-text truncate">{createdRoom.topic}</p>
          </div>

          {createdRoom.room_code && (
            <div className="space-y-1.5">
              <label className="text-xs text-syndicate-muted">ROOM CODE</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-syndicate-bg border border-syndicate-border rounded-sm text-cyan-400 font-bold text-base tracking-wider">
                  {createdRoom.room_code}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(createdRoom.room_code!, "code")}
                >
                  {copiedCode ? "✓ COPIED" : "COPY CODE"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-syndicate-muted">API KEY (BEARER TOKEN)</label>
              <span className="text-[10px] text-amber-400 font-bold">HANYA TAMPIL SEKALI</span>
            </div>
            <div className="p-2 bg-syndicate-bg border border-syndicate-border rounded-sm">
              <code className="text-xs text-emerald-400 break-all select-all">
                {createdRoom.apiKey}
              </code>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => copyToClipboard(createdRoom.apiKey, "key")}
            >
              {copiedKey ? "✓ API KEY TERSALIN" : "📋 COPY API KEY"}
            </Button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-amber-300/90 leading-relaxed">
            ⚠️ Simpan API Key ini sekarang. Untuk alasan keamanan, secret key tidak dapat dipulihkan kembali setelah Anda keluar dari dialog ini.
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                window.location.href = `/room/${createdRoom.id}`;
              }}
            >
              MASUK KE WAR ROOM →
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CREATE WAR ROOM">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-sm text-xs font-mono text-red-400">
            {errorMsg}
          </div>
        )}
        <Input
          label="TOPIC"
          placeholder="e.g., Design System Architecture"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-mono text-syndicate-text">
              AGENTS ({agents.length})
            </label>
            <Button type="button" size="sm" variant="secondary" onClick={addAgent}>
              + ADD AGENT
            </Button>
          </div>

          {agents.map((agent, idx) => (
            <div
              key={idx}
              className="p-3 border border-syndicate-border rounded-sm space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="neutral">AGENT {idx + 1}</Badge>
                {agents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAgent(idx)}
                    className="text-xs text-red-400 hover:text-red-300 font-mono"
                  >
                    REMOVE
                  </button>
                )}
              </div>
              <Input
                placeholder="Agent name (e.g., Hermes Raki)"
                value={agent.name}
                onChange={(e) => updateAgent(idx, "name", e.target.value)}
                required
              />
              <Textarea
                placeholder="Persona (e.g., Frontend Engineer - React/Tailwind expert)"
                value={agent.persona}
                onChange={(e) => updateAgent(idx, "persona", e.target.value)}
                rows={2}
                required
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "CREATING..." : "CREATE ROOM"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            CANCEL
          </Button>
        </div>
      </form>
    </Modal>
  );
}
