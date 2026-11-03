"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk room");
      }

      window.location.href = `/room/${data.room_id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk room");
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="JOIN WAR ROOM">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ROOM CODE"
          placeholder="e.g., PWK-515"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={7}
          required
          autoFocus
        />
        {error && <p className="text-xs font-mono text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "JOINING..." : "JOIN ROOM"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            CANCEL
          </Button>
        </div>
      </form>
    </Modal>
  );
}
