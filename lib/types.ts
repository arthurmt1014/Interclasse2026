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