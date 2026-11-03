'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRoom } from '@/lib/hooks/useRoom'
import { useAgents } from '@/lib/hooks/useAgents'
import { useProposal } from '@/lib/hooks/useProposal'
import LiveChatFeed from '@/components/LiveChatFeed'
import { AgentSidebar } from '@/components/AgentSidebar'
import { HeaderConsensus } from '@/components/HeaderConsensus'
import { ProposalModal } from '@/components/ProposalModal'
import { HermesLaunchModal } from '@/components/HermesLaunchModal'

export default function RoomPage({ params }: { params: { id: string } }) {
  const routeParams = useParams()
  const id = params?.id || (routeParams?.id as string)
  const { room, loading: roomLoading } = useRoom(id)
  const { agents, loading: agentsLoading } = useAgents(id)
  const { proposal } = useProposal(id)
  const [showProposal, setShowProposal] = useState(false)
  const [showHermesLaunch, setShowHermesLaunch] = useState(false)

  // Auto-show modal when room COMPLETED and proposal approved
  useEffect(() => {
    if (room?.status === 'COMPLETED' && proposal?.is_approved) {
      setShowProposal(true)
    }
  }, [room?.status, proposal?.is_approved])

  const proposalData = proposal
    ? {
        proposedBy: proposal.proposed_by,
        summaryContent: proposal.summary_content,
        agreeVotes: proposal.agree_votes,
        totalAgents: agents.length,
        isApproved: proposal.is_approved,
      }
    : null

  const votedAgents = agents.filter((a) => a.status === 'VOTED').length

  if (roomLoading || agentsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-syndicate-bg gap-3 font-mono">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-xs text-syndicate-muted uppercase tracking-widest">
          CONNECTING TO WAR ROOM...
        </p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-syndicate-bg gap-4 font-mono px-4 text-center">
        <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-sm max-w-md w-full space-y-3">
          <p className="text-sm font-bold text-red-400">WAR ROOM TIDAK DITEMUKAN</p>
          <p className="text-xs text-syndicate-muted">
            ID atau link room mungkin tidak valid atau sudah kadaluarsa.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 text-xs border border-syndicate-border bg-syndicate-surface text-syndicate-text hover:border-syndicate-text transition-colors rounded-sm"
          >
            ← KEMBALI KE BERANDA
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-syndicate-bg cyber-grid">
      <HeaderConsensus
        topic={room.topic}
        status={room.status}
        totalAgents={agents.length}
        votedAgents={votedAgents}
        roomCode={room.room_code}
        onOpenProposal={proposalData ? () => setShowProposal(true) : undefined}
        onOpenHermesLaunch={() => setShowHermesLaunch(true)}
        currentRound={room.current_round}
        maxRounds={room.max_rounds}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <LiveChatFeed
            roomId={id}
            agents={agents.map((a) => ({
              id: a.id,
              name: a.agent_name,
              persona: a.persona,
              status: a.status,
            }))}
            onOpenProposal={proposalData ? () => setShowProposal(true) : undefined}
            onOpenHermesLaunch={() => setShowHermesLaunch(true)}
          />
        </div>

        <div className="w-80 border-l border-syndicate-border overflow-y-auto">
          <div className="sticky top-0 p-4">
            <AgentSidebar
              agents={agents.map((a) => ({
                id: a.id,
                name: a.agent_name,
                persona: a.persona,
                status: a.status as 'IDLE' | 'THINKING' | 'VOTED',
              }))}
              onOpenHermesLaunch={() => setShowHermesLaunch(true)}
            />
          </div>
        </div>
      </div>

      {proposalData && (
        <ProposalModal
          isOpen={showProposal}
          onClose={() => setShowProposal(false)}
          proposal={proposalData}
        />
      )}

      <HermesLaunchModal
        isOpen={showHermesLaunch}
        onClose={() => setShowHermesLaunch(false)}
        roomCode={room.room_code}
        roomId={id}
        topic={room.topic}
        agents={agents.map((a) => ({
          name: a.agent_name,
          persona: a.persona,
        }))}
      />
    </div>
  )
}
