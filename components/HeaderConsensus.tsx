"use client";

import { useState } from "react";
import { Badge } from "./ui/Badge";

interface HeaderConsensusProps {
  topic: string;
  status: "IDLE" | "RUNNING" | "COMPLETED";
  totalAgents: number;
  votedAgents: number;
  roomCode?: string | null;
  onOpenProposal?: () => void;
  onOpenHermesLaunch?: () => void;
  currentRound?: number;
  maxRounds?: number;
}

export function HeaderConsensus({
  topic,
  status,
  totalAgents,
  votedAgents,
  roomCode,
  onOpenProposal,
  onOpenHermesLaunch,
}: HeaderConsensusProps) {
  const [copied, setCopied] = useState(false);
  const progressPercent = totalAgents > 0 ? (votedAgents / totalAgents) * 100 : 0;

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-syndicate-surface border-b border-syndicate-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Topic & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono text-syndicate-muted mb-1.5">
              <a href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold">
                ← SYNDICATE
              </a>
              <span>/</span>
              <span className="text-syndicate-muted/80">WAR ROOM</span>
            </div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-mono font-bold text-lg text-syndicate-text truncate">
                {topic}
              </h1>
              <Badge
                variant={
                  status === "COMPLETED"
                    ? "agreed"
                    : status === "RUNNING"
                    ? "active"
                    : "neutral"
                }
              >
                {status}
              </Badge>
              {roomCode && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Click to copy Room Code"
                  className="px-2 py-0.5 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 font-mono text-xs rounded-sm hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-syndicate-muted">CODE:</span>
                  <span className="font-bold tracking-wider">{roomCode}</span>
                  <span className="text-[10px] text-syndicate-muted">
                    {copied ? "✓ COPIED" : "📋"}
                  </span>
                </button>
              )}
              {onOpenHermesLaunch && (
                <button
                  type="button"
                  onClick={onOpenHermesLaunch}
                  title="Salin 1-Line Hermes Launch Command"
                  className="px-2.5 py-0.5 border border-emerald-500/60 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-mono text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                >
                  <span className="animate-pulse">⚡</span>
                  <span>HERMES RUNNER</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-syndicate-muted">
              <span>CONTINUOUS WAR ROOM</span>
              <span>•</span>
              <span>
                AGENTS: {totalAgents}
              </span>
            </div>
          </div>

          {/* Right: Consensus Progress */}
          <div
            className={`lg:w-80 ${onOpenProposal ? "cursor-pointer group" : ""}`}
            onClick={onOpenProposal}
            title={onOpenProposal ? "Klik untuk melihat detail proposal" : undefined}
          >
            <div className="flex items-center justify-between text-xs font-mono text-syndicate-muted mb-2">
              <span className={onOpenProposal ? "group-hover:text-cyan-400 transition-colors" : ""}>
                CONSENSUS PROGRESS {onOpenProposal ? "↗" : ""}
              </span>
              <span>
                {votedAgents} / {totalAgents}
              </span>
            </div>
            <div className="h-2 bg-syndicate-bg border border-syndicate-border rounded-sm overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
