'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useMessages } from '@/lib/hooks/useMessages'
import type { Message } from '@/lib/supabase/client'

export interface AgentInfo {
  id?: string
  name: string
  persona?: string
  status?: string
}

interface LiveChatFeedProps {
  roomId: string
  agents?: AgentInfo[]
  onOpenProposal?: () => void
  onOpenHermesLaunch?: () => void
}

// Known agent defaults
const KNOWN_AGENTS: Record<string, { initial: string; tag: string; role: string }> = {
  Noelle: { initial: 'N', tag: 'LEAD', role: 'Lead Coordinator' },
  Rover: { initial: 'R', tag: 'ARCH', role: 'System Architect' },
  Diablo: { initial: 'D', tag: 'FE', role: 'Frontend Engineer' },
}

export default function LiveChatFeed({ roomId, agents = [], onOpenProposal, onOpenHermesLaunch }: LiveChatFeedProps) {
  const { messages, loading } = useMessages(roomId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [shouldScroll, setShouldScroll] = useState(false)
  const [currentPov, setCurrentPov] = useState<string>('Noelle')

  // Load POV from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('syndicate_pov')
      if (saved) {
        setCurrentPov(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSelectPov = (pov: string) => {
    setCurrentPov(pov)
    try {
      localStorage.setItem('syndicate_pov', pov)
    } catch {
      // ignore
    }
  }

  // Build dynamic list of available POVs
  const availablePovs = useMemo(() => {
    const list = ['Noelle', 'Rover', 'Diablo']
    agents.forEach((a) => {
      if (a.name && !list.includes(a.name)) {
        list.push(a.name)
      }
    })
    messages.forEach((m) => {
      if (m.agent_name && !list.includes(m.agent_name)) {
        list.push(m.agent_name)
      }
    })
    list.push('Spectator')
    return list
  }, [agents, messages])

  // Track active thinking agents for live typing indicator
  const thinkingAgents = useMemo(() => {
    if (!agents) return []
    return agents.filter((a) => a.status === 'THINKING')
  }, [agents])

  // Calculate voting progress
  const votingStats = useMemo(() => {
    const votes = messages.filter((m) => m.type === 'VOTE')
    const proposals = messages.filter((m) => m.type === 'PROPOSAL')
    const agrees = votes.filter((v) => v.content.includes('AGREE')).length
    const disagrees = votes.filter((v) => v.content.includes('DISAGREE')).length

    return {
      hasProposal: proposals.length > 0,
      lastProposal: proposals[proposals.length - 1] || null,
      agrees,
      disagrees,
      total: votes.length,
      consensus: agrees > 0 && disagrees === 0 ? 'AGREE' : disagrees > 0 && agrees === 0 ? 'DISAGREE' : null,
    }
  }, [messages])

  // Smart auto-scroll
  useEffect(() => {
    if (shouldScroll && autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      setShouldScroll(false)
    }
  }, [messages, autoScroll, shouldScroll, thinkingAgents.length])

  useEffect(() => {
    setShouldScroll(true)
  }, [messages.length, thinkingAgents.length])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setAutoScroll(isAtBottom)
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getAgentConfig = (agentName: string) => {
    const known = KNOWN_AGENTS[agentName]
    if (known) return known
    return {
      initial: agentName ? agentName[0].toUpperCase() : '?',
      tag: (agentName || 'AGT').slice(0, 4).toUpperCase(),
      role: 'Agent',
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0B0D]">
        <p className="text-[#85858D] font-mono text-xs uppercase tracking-wider">Mengambil pesan war room...</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0D]">
      {/* POV & Perspective Toolbar */}
      <div className="px-6 py-2.5 bg-syndicate-surface border-b border-syndicate-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] text-syndicate-muted uppercase tracking-wider font-semibold">
            PERSPEKTIF POV:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {availablePovs.map((name) => {
              const active = currentPov.toLowerCase() === name.toLowerCase()
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectPov(name)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-all border cursor-pointer ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-syndicate-bg text-syndicate-muted border-syndicate-border hover:text-syndicate-text hover:border-syndicate-muted'
                  }`}
                >
                  {name === 'Spectator' ? '👁️ SPECTATOR' : name}
                </button>
              )
            })}
          </div>
        </div>
        <div className="text-[11px] font-mono text-syndicate-muted hidden sm:block">
          POV KANAN: <span className="text-emerald-400 font-bold">{currentPov}</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-[18px] scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#45454D transparent' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4 font-mono">
            <div className="w-12 h-12 rounded-full border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center relative">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-syndicate-text tracking-wide">
                WAR ROOM STANDBY & WAITING FOR AGENTS
              </p>
              <p className="text-xs text-syndicate-muted max-w-md mx-auto leading-relaxed">
                Ruang diskusi sudah siap. Jalankan agen Hermes CLI di terminal untuk memulai perdebatan otomatis.
              </p>
            </div>
            {onOpenHermesLaunch && (
              <button
                type="button"
                onClick={onOpenHermesLaunch}
                className="mt-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/50 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold rounded-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <span className="animate-pulse">⚡</span>
                <span>SALIN PERINTAH RUNNER HERMES</span>
              </button>
            )}
          </div>
        ) : (
          messages.map((msg: Message) => {
            const agent = getAgentConfig(msg.agent_name)
            const isMe =
              currentPov !== 'Spectator' &&
              msg.agent_name.trim().toLowerCase() === currentPov.trim().toLowerCase()

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-[6px] w-fit max-w-[min(780px,88%)] animate-[sent_0.25s_ease-out] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Agent Info */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-[26px] h-[26px] flex items-center justify-center border font-mono text-xs font-bold ${
                      isMe
                        ? 'border-emerald-500/60 bg-[#1E2F2D] text-emerald-300'
                        : 'border-[#45454D] bg-[#0B0B0D] text-[#E8E8EC]'
                    }`}
                    aria-hidden="true"
                  >
                    {agent.initial}
                  </div>
                  <span className={`font-mono text-sm font-bold ${isMe ? 'text-emerald-300' : 'text-[#E8E8EC]'}`}>
                    {msg.agent_name}
                  </span>
                  <span className="font-mono text-[10px] font-medium tracking-wider border border-[#45454D] px-[6px] py-[1px] text-[#9D9DA6]">
                    {agent.tag}
                  </span>
                  {isMe && (
                    <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/40 px-1 py-0.5 bg-emerald-500/10">
                      YOU
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`relative min-w-[min(260px,100%)] max-w-full ${
                    isMe
                      ? 'bg-[#1E2F2D] border-[#1A6B50] rounded-[18px_0_18px_18px]'
                      : 'bg-[#202024] border-[#45454D] rounded-[0_18px_18px_18px]'
                  } border px-4 pt-3 pb-2 shadow-sm`}
                >
                  {/* Tail triangle */}
                  <div
                    className={`absolute w-0 h-0 border-solid border-transparent ${
                      isMe
                        ? 'right-[-10px] top-[-1px] border-t-[11px] border-t-[#1A6B50] border-r-[10px]'
                        : 'left-[-10px] top-[-1px] border-t-[11px] border-t-[#45454D] border-l-[10px]'
                    }`}
                  />
                  <div
                    className={`absolute w-0 h-0 border-solid border-transparent ${
                      isMe
                        ? 'right-[-9px] top-0 border-t-[10px] border-t-[#1E2F2D] border-r-[10px]'
                        : 'left-[-9px] top-0 border-t-[10px] border-t-[#202024] border-l-[10px]'
                    }`}
                  />

                  {/* Badge Tags */}
                  {(msg.type === 'PROPOSAL' || msg.type === 'VOTE') && (
                    <div className="flex gap-[6px] flex-wrap mb-[10px]">
                      {msg.type === 'PROPOSAL' && (
                        <button
                          type="button"
                          onClick={onOpenProposal}
                          title={onOpenProposal ? 'Buka detail proposal' : undefined}
                          className={`text-[11px] font-mono font-medium tracking-wider uppercase px-[9px] py-[3px] border border-amber-500/60 bg-amber-500/10 text-amber-400 whitespace-nowrap proposal-glow ${
                            onOpenProposal ? 'hover:bg-amber-500/25 cursor-pointer' : ''
                          }`}
                        >
                          [PROPOSAL] {onOpenProposal ? '↗' : ''}
                        </button>
                      )}
                      {msg.type === 'VOTE' && (
                        <span
                          className={`text-[11px] font-mono font-medium tracking-wider uppercase px-[9px] py-[3px] border whitespace-nowrap badge-pulse ${
                            msg.content.includes('AGREE')
                              ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
                              : 'border-red-500/60 bg-red-500/10 text-red-400'
                          }`}
                        >
                          {msg.content.includes('AGREE') ? '[VOTE: AGREE]' : '[VOTE: DISAGREE]'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="font-mono text-sm leading-[1.8] text-[#E8E8EC]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-3 overflow-wrap-anywhere" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const isBlock = /language-/.test(className ?? '')
                          return isBlock ? (
                            <div className="relative rounded-[10px] bg-[#0B0B0D] border border-[#45454D] px-[14px] py-3 overflow-x-auto font-mono text-xs leading-[1.7] text-[#E8E8EC] mb-3">
                              <pre className="whitespace-pre">
                                <code>{children}</code>
                              </pre>
                              <span className="absolute top-0 right-0 px-2 py-[2px] border-l border-b border-[#45454D] font-mono text-[10px] font-medium tracking-widest text-[#9D9DA6]">
                                CODE
                              </span>
                            </div>
                          ) : (
                            <code
                              className="rounded-[5px] bg-[#0B0B0D] border border-[#45454D] px-[5px] py-0 font-mono text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-2 border-emerald-500 pl-3 text-[#85858D] mb-3" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Footer timestamp */}
                  <div className="mt-2 text-right font-mono text-[11px] font-medium text-[#9D9DA6]">
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Live Typing / Thinking Indicators */}
        {thinkingAgents.map((agent) => (
          <div
            key={agent.id || agent.name}
            className="flex flex-col gap-1.5 mr-auto items-start animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <div className="w-[26px] h-[26px] flex items-center justify-center border border-emerald-500/50 bg-[#162723] font-mono text-xs font-bold text-emerald-300 relative shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-1 -right-1" />
                {agent.name ? agent.name[0].toUpperCase() : 'A'}
              </div>
              <span className="font-mono text-xs font-bold text-[#E8E8EC]">{agent.name}</span>
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
                <span>menganalisis & menyusun argumen</span>
                <span className="cursor-blink font-bold">_</span>
              </span>
            </div>
            <div className="bg-[#1C1C20] border border-[#3E3E47] rounded-[0_14px_14px_14px] px-4 py-2.5 flex items-center gap-2.5 shadow-md">
              <div className="flex items-center gap-1 h-3.5">
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '10px', animationDelay: '0ms' }} />
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '14px', animationDelay: '150ms' }} />
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '8px', animationDelay: '300ms' }} />
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: '12px', animationDelay: '450ms' }} />
              </div>
              <span className="text-[10px] font-mono text-syndicate-muted tracking-wider uppercase">
                GENERATING TOKENS
              </span>
            </div>
          </div>
        ))}

        <div ref={scrollRef} />
      </div>

      {/* Voting Progress Indicator */}
      {votingStats.hasProposal && votingStats.total > 0 && (
        <div
          className={`px-6 py-4 border-t border-[#45454D] bg-[#0B0B0D]/50 ${
            onOpenProposal ? 'cursor-pointer hover:bg-[#16161A]/70 transition-colors' : ''
          }`}
          onClick={onOpenProposal}
          title={onOpenProposal ? 'Buka detail proposal' : undefined}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#85858D] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                Consensus Voting {onOpenProposal ? '↗' : ''}
              </span>
              {votingStats.consensus && (
                <span
                  className={`text-xs font-mono px-2 py-1 ${
                    votingStats.consensus === 'AGREE' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {votingStats.consensus === 'AGREE' ? '✓ KESEPAKATAN' : '✗ PENOLAKAN'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-[3px] bg-[#0B0B0D] border-0 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(votingStats.agrees / Math.max(votingStats.total, 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums min-w-[4ch]">
                {votingStats.agrees}/{votingStats.total}
              </span>
            </div>

            <div className="text-xs font-mono text-[#85858D] grid grid-cols-2 gap-2">
              <div>
                ✓ Setuju: <span className="text-emerald-400">{votingStats.agrees}</span>
              </div>
              <div>
                ✗ Tidak: <span className="text-red-400">{votingStats.disagrees}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll Indicator */}
      {!autoScroll && messages.length > 0 && (
        <div className="px-6 pb-3 pt-2 border-t border-[#45454D]">
          <button
            onClick={() => {
              setAutoScroll(true)
              setShouldScroll(true)
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition uppercase tracking-wider cursor-pointer"
          >
            ↓ Jump to latest messages
          </button>
        </div>
      )}
    </div>
  )
}
