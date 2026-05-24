'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth }    from '@/hooks/useAuth'
import { useTeams }   from '@/hooks/useTeams'
import { usePlayers } from '@/hooks/usePlayers'
import { useMatches } from '@/hooks/useMatches'
import { useGoals }   from '@/hooks/useGoals'
import { useCards }   from '@/hooks/useCards'
import { useKnockout } from '@/hooks/useKnockout'
import { calcStandings } from '@/lib/standings'
import AdminPanel from '@/components/admin/AdminPanel'

export default function AdminPage() {
  const { isAdmin, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/login')
  }, [isAdmin, authLoading, router])

  const { teams,   addTeam,   updateTeam,   deleteTeam }   = useTeams()
  const { players, addPlayer, updatePlayer, deletePlayer } = usePlayers()
  const { matches, addMatch,  updateMatch,  deleteMatch }  = useMatches()
  const { goals,   addGoal,   deleteGoal }                 = useGoals()
  const { cards,   addCard,   deleteCard }                 = useCards()
  const { knockout, setKnockout, updateKnockout }          = useKnockout()

  if (authLoading || !isAdmin) return (
    <div style={{ minHeight: '100vh', background: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: "'Oswald',sans-serif", fontSize: 14 }}>
      Verificando acesso...
    </div>
  )

  const stats = calcStandings(teams, matches)

  return (
    <AdminPanel
      db={{ teams, players, matches, goals, cards, knockout }}
      stats={stats}
      actions={{
        addTeam, updateTeam, deleteTeam,
        addPlayer, updatePlayer, deletePlayer,
        addMatch, updateMatch, deleteMatch,
        addGoal, deleteGoal,
        addCard, deleteCard,
        setKnockout, updateKnockout,
      }}
      onLogout={async () => { await signOut(); router.push('/') }}
    />
  )
}