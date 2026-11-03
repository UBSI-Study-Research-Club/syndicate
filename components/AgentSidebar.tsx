"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface Agent {
  id: string;
  name: string;
  persona: string;
  status: "IDLE" | "THINKING" | "VOTED";
}

interface AgentSidebarProps {
  agents: Agent[];
  roomApiKey?: string;
  onOpenHermesLaunch?: () => void;
}

export function AgentSidebar({ agents, roomApiKey, onOpenHermesLaunch }: AgentSidebarProps) {
  const [copied, setCopied] = useState(false);

  const copyApiKey = async () => {
    if (roomApiKey) {
      try {
        await navigator.clipboard.writeText(roomApiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    }
  };

  return (
    <div className="space-y-4">
      {onOpenHermesLaunch && (
        <button
          type="button"
          onClick={onOpenHermesLaunch}
          className="w-full py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[0_0_18px_rgba(16,185,129,0.25)]"
        >
          <span className="animate-pulse">⚡</span>
          <span>1-CLICK HERMES COMMAND</span>
        </button>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-mono font-bold text-syndicate-text text-sm">
            AGENT MONITOR
          </h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {agents.length === 0 ? (
            <p className="text-xs font-mono text-syndicate-muted">
              No agents connected yet...
            </p>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 border border-syndicate-border rounded-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-sm text-syndicate-text truncate">
                      {agent.name}
                    </div>
                    <div className="text-xs font-mono text-syndicate-muted truncate">
                      {agent.persona}
                    </div>
                  </div>
                  {agent.status === "THINKING" && (
                    <span className="relative flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      agent.status === "THINKING"
                        ? "active"
                        : agent.status === "VOTED"
                        ? "agreed"
                        : "neutral"
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {roomApiKey && (
        <Card>
          <CardHeader>
            <h2 className="font-mono font-bold text-syndicate-text text-sm">
              ROOM API KEY
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="p-2 bg-syndicate-bg border border-syndicate-border rounded-sm">
                <code className="text-xs font-mono text-syndicate-muted break-all">
                  {roomApiKey}
                </code>
              </div>
              <button
                type="button"
                onClick={copyApiKey}
                className="w-full px-3 py-2 text-xs font-mono font-medium bg-syndicate-surface border border-syndicate-border rounded-sm text-syndicate-text hover:border-syndicate-text transition-colors cursor-pointer"
              >
                {copied ? "✓ API KEY TERSALIN" : "📋 COPY TO CLIPBOARD"}
              </button>
              <div className="text-xs font-mono text-syndicate-muted space-y-1">
                <p className="font-bold">Setup MCP in Hermes CLI:</p>
                <code className="block bg-syndicate-bg p-2 rounded-sm">
                  hermes mcp add syndicate \<br />
                  &nbsp;&nbsp;--url http://localhost:3000/api/mcp \<br />
                  &nbsp;&nbsp;--key {roomApiKey?.slice(0, 16)}...
                </code>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
