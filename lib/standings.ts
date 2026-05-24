import { Match, Team, TeamStats } from './types'

export const BASE_STATS: Record<number, Omit<TeamStats, 'sg'>> = {
  1:  { pts:10, j:4, v:3, e:1, d:0, gf:15, gc:2  },
  2:  { pts:9,  j:4, v:3, e:0, d:1, gf:14, gc:3  },
  3:  { pts:9,  j:4, v:3, e:0, d:1, gf:9,  gc:4  },
  4:  { pts:9,  j:4, v:3, e:0, d:1, gf:8,  gc:4  },
  5:  { pts:3,  j:4, v:1, e:0, d:3, gf:4,  gc:5  },
  6:  { pts:6,  j:4, v:2, e:0, d:2, gf:6,  gc:6  },
  7:  { pts:12, j:4, v:4, e:0, d:0, gf:22, gc:2  },
  8:  { pts:6,  j:4, v:2, e:0, d:2, gf:9,  gc:4  },
  9:  { pts:3,  j:4, v:1, e:0, d:3, gf:2,  gc:15 },
  10: { pts:3,  j:4, v:1, e:0, d:3, gf:3,  gc:13 },
  11: { pts:0,  j:4, v:0, e:0, d:4, gf:1,  gc:10 },
  12: { pts:1,  j:4, v:0, e:1, d:3, gf:2,  gc:17 },
}

export function calcStandings(
  teams: Team[],
  matches: Match[]
): Record<number, TeamStats> {
  const s: Record<number, TeamStats> = {}

  teams.forEach(t => {
    const b = BASE_STATS[t.id] ?? { pts:0, j:0, v:0, e:0, d:0, gf:0, gc:0 }
    s[t.id] = { ...b, sg: b.gf - b.gc }
  })

  matches
    .filter(m => m.status === 'encerrada' && m.gols_a !== null && m.gols_b !== null)
    .forEach(m => {
      const a = s[m.time_a], b = s[m.time_b]
      if (!a || !b) return
      const ga = Number(m.gols_a), gb = Number(m.gols_b)
      a.j++; b.j++
      a.gf += ga; a.gc += gb
      b.gf += gb; b.gc += ga
      if (ga > gb)      { a.pts += 3; a.v++; b.d++ }
      else if (gb > ga) { b.pts += 3; b.v++; a.d++ }
      else              { a.pts++; a.e++; b.pts++; b.e++ }
      a.sg = a.gf - a.gc
      b.sg = b.gf - b.gc
    })

  return s
}

export function sortGroup(teams: Team[], stats: Record<number, TeamStats>): Team[] {
  return [...teams].sort((a, b) => {
    const sa = stats[a.id] ?? { pts:0, sg:0, gf:0 }
    const sb = stats[b.id] ?? { pts:0, sg:0, gf:0 }
    return (sb.pts - sa.pts) || (sb.sg - sa.sg) || (sb.gf - sa.gf) || a.nome.localeCompare(b.nome)
  })
}

export function calcScorers(
  goals: import('./types').Goal[],
  players: import('./types').Player[],
  teams: Team[]
) {
  const map: Record<number, number> = {}
  goals.forEach(g => { map[g.player_id] = (map[g.player_id] ?? 0) + 1 })
  const pMap = Object.fromEntries(players.map(p => [p.id, p]))
  const tMap = Object.fromEntries(teams.map(t => [t.id, t]))
  return Object.entries(map)
    .map(([id, gols]) => ({ ...pMap[Number(id)], gols, team: tMap[pMap[Number(id)]?.time_id] }))
    .filter(x => x.nome)
    .sort((a, b) => b.gols - a.gols)
}