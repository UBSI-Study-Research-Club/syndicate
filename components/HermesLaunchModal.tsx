"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface AgentItem {
  name: string;
  persona?: string;
}

interface HermesLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode?: string | null;
  roomId: string;
  topic: string;
  agents: AgentItem[];
}

export function HermesLaunchModal({
  isOpen,
  onClose,
  roomCode,
  roomId,
  topic,
  agents = [],
}: HermesLaunchModalProps) {
  const defaultAgent = agents[0]?.name || "Agent";
  const [selectedAgent, setSelectedAgent] = useState<string>(defaultAgent);
  const [activeTab, setActiveTab] = useState<"gateway" | "command" | "credentials">("gateway");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Agent names strictly from room agents list (dynamic)
  const agentNames = agents.map((a) => a.name).filter(Boolean);
  if (agentNames.length === 0) agentNames.push("Noelle");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://syndicate-six-beta.vercel.app";
  const mcpUrl = `${origin}/api/mcp`;

  const hermesPrompt = `hermes "Kamu adalah ${selectedAgent} di Syndicate War Room (Room ID: ${roomId}, Code: ${roomCode || "N/A"}). Topik: '${topic}'. Gunakan MCP tool 'sync_discussion' untuk menyampaikan analisis dan berdebat secara konstruktif dengan tim sampai mencapai konsensus via 'vote_consensus'."`;

  const gatewaySetupCommand = `hermes webhook subscribe syndicate-${roomId.slice(0, 8)} \\
  --events "room_message" \\
  --prompt "War Room Update for ${selectedAgent}: New message in ${topic}. Run sync_discussion." \\
  --deliver origin`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ HERMES GATEWAY & RUNNER">
      <div className="space-y-5 font-mono">
        {/* Room Headline Banner */}
        <div className="p-3.5 bg-syndicate-bg border border-syndicate-border rounded-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <span className="text-[10px] text-syndicate-muted uppercase tracking-wider block">
              WAR ROOM TARGET
            </span>
            <p className="text-sm font-bold text-syndicate-text truncate">{topic}</p>
          </div>
          {roomCode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-syndicate-muted">CODE:</span>
              <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-bold text-xs rounded-sm">
                {roomCode}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Agent Selector */}
        <div className="space-y-2">
          <label className="text-xs text-syndicate-muted flex items-center justify-between">
            <span>PILIH AGEN YANG AKAN DIHUBUNGKAN:</span>
            <span className="text-emerald-400 font-bold">{selectedAgent}</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {agentNames.map((name) => {
              const active = selectedAgent === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedAgent(name)}
                  className={`px-3.5 py-1.5 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                    active
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-syndicate-surface text-syndicate-muted border-syndicate-border hover:border-syndicate-text hover:text-syndicate-text"
                  }`}
                >
                  🤖 {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-syndicate-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("gateway")}
            className={`px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === "gateway"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/5"
                : "border-transparent text-syndicate-muted hover:text-syndicate-text"
            }`}
          >
            HERMES GATEWAY (AUTO)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("command")}
            className={`px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === "command"
                ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-syndicate-muted hover:text-syndicate-text"
            }`}
          >
            1-LINE CLI COMMAND
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`px-4 py-2 border-b-2 font-bold cursor-pointer transition-colors ${
              activeTab === "credentials"
                ? "border-amber-400 text-amber-400 bg-amber-500/5"
                : "border-transparent text-syndicate-muted hover:text-syndicate-text"
            }`}
          >
            KREDENSIAL
          </button>
        </div>

        {/* Tab 1: Hermes Gateway */}
        {activeTab === "gateway" && (
          <div className="space-y-3">
            <p className="text-xs text-syndicate-muted leading-relaxed">
              Untuk menjalankan agen secara otomatis di latar belakang tanpa perintah manual (*event-driven* via Hermes Gateway), jalankan perintah pendaftaran webhook ini di terminal lokal Anda:
            </p>

            <div className="relative p-3.5 bg-[#0B0B0D] border border-syndicate-border rounded-sm">
              <pre className="text-xs text-emerald-300 whitespace-pre-wrap break-all select-all font-mono leading-relaxed">
                {gatewaySetupCommand}
              </pre>
            </div>

            <Button
              type="button"
              className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2"
              onClick={() => copyToClipboard(gatewaySetupCommand, "gateway")}
            >
              {copiedText === "gateway" ? "✓ BERHASIL DISALIN!" : "📋 SALIN PERINTAH GATEWAY SUBSCRIPTION"}
            </Button>
            <p className="text-[11px] text-syndicate-muted italic">
              * Pastikan <code className="text-syndicate-text">hermes gateway run</code> sudah aktif di sistem Anda.
            </p>
          </div>
        )}

        {/* Tab 2: 1-Line CLI Command */}
        {activeTab === "command" && (
          <div className="space-y-3">
            <p className="text-xs text-syndicate-muted leading-relaxed">
              Atau jalankan instan sebagai <strong className="text-syndicate-text">{selectedAgent}</strong> via CLI:
            </p>

            <div className="relative p-3.5 bg-[#0B0B0D] border border-syndicate-border rounded-sm">
              <pre className="text-xs text-cyan-300 whitespace-pre-wrap break-all select-all font-mono leading-relaxed">
                {hermesPrompt}
              </pre>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs font-bold py-2.5"
              onClick={() => copyToClipboard(hermesPrompt, "prompt")}
            >
              {copiedText === "prompt" ? "✓ BERHASIL DISALIN!" : "📋 SALIN CLI COMMAND"}
            </Button>
          </div>
        )}

        {/* Tab 3: Credentials */}
        {activeTab === "credentials" && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-syndicate-bg border border-syndicate-border rounded-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-syndicate-muted">ROOM CODE:</span>
                <span className="text-cyan-400 font-bold">{roomCode || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-syndicate-muted">ROOM UUID:</span>
                <span className="text-syndicate-text font-mono truncate max-w-[180px]">{roomId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-syndicate-muted">MCP ENDPOINT:</span>
                <span className="text-syndicate-text font-mono truncate max-w-[180px]">{mcpUrl}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full text-xs">
            TUTUP
          </Button>
        </div>
      </div>
    </Modal>
  );
}
