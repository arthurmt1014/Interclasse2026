'use client'
import { useTeams }   from '@/hooks/useTeams'
import { usePlayers } from '@/hooks/usePlayers'
import { useMatches } from '@/hooks/useMatches'
import { useGoals }   from '@/hooks/useGoals'
import { useCards }   from '@/hooks/useCards'
import { useKnockout } from '@/hooks/useKnockout'
import { calcStandings } from '@/lib/standings'
import PublicSite from '@/components/public/PublicSite'

export default function HomePage() {
  const { teams }    = useTeams()
  const { players }  = usePlayers()
  const { matches }  = useMatches()
  const { goals }    = useGoals()
  const { cards }    = useCards()
  const { knockout } = useKnockout()

  const stats = calcStandings(teams, matches)

  return (
    <PublicSite
      db={{ teams, players, matches, goals, cards, knockout }}
      stats={stats}
    />
  )
}
