export interface Team {
  id: number
  nome: string
  turma?: string
  grupo: number
  foto_url?: string
  descricao?: string
}

export interface Player {
  id: number
  nome: string
  numero: number
  posicao?: string
  time_id: number
  foto_url?: string
}

export interface Match {
  id: number
  time_a: number
  time_b: number
  gols_a: number | null
  gols_b: number | null
  rodada: number
  data?: string
  status: 'agendada' | 'ao_vivo' | 'encerrada'
}

export interface Goal {
  id: number
  match_id: number
  player_id: number
  player_name?: string
  minuto: number
}

export interface Card {
  id: number
  match_id: number
  player_id: number
  tipo: 'amarelo' | 'vermelho'
  minuto: number
}

export interface KnockoutMatch {
  id: number
  fase: 'quartas' | 'semifinal' | 'final'
  pos: number
  time_a: number | null
  time_b: number | null
  gols_a: number | null
  gols_b: number | null
  vencedor: number | null
}

export interface TeamStats {
  pts: number
  j: number
  v: number
  e: number
  d: number
  gf: number
  gc: number
  sg: number
}

export interface DB {
  teams: Team[]
  players: Player[]
  matches: Match[]
  goals: Goal[]
  cards: Card[]
  knockout: KnockoutMatch[]
}

export interface AdminActions {
  addTeam: (t: Omit<Team, 'id'>) => Promise<void>
  updateTeam: (t: Team) => Promise<void>
  deleteTeam: (id: number) => Promise<void>
  addPlayer: (p: Omit<Player, 'id'>) => Promise<void>
  updatePlayer: (p: Player) => Promise<void>
  deletePlayer: (id: number) => Promise<void>
  addMatch: (m: Omit<Match, 'id'>) => Promise<void>
  updateMatch: (m: Match) => Promise<void>
  deleteMatch: (id: number) => Promise<void>
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>
  deleteGoal: (id: number) => Promise<void>
  addCard: (c: Omit<Card, 'id'>) => Promise<void>
  deleteCard: (id: number) => Promise<void>
  setKnockout: (matches: Omit<KnockoutMatch, 'id'>[]) => Promise<void>
  updateKnockout: (k: KnockoutMatch) => Promise<void>
}