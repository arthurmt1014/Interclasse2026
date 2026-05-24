import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { Match } from '@/lib/types'

export function useMatches() {
  const { data: matches, loading } = useRealtimeTable<Match>('matches')
  const addMatch    = async (m: Omit<Match,'id'>) => { await supabase.from('matches').insert(m) }
  const updateMatch = async (m: Match) => { const { id, ...r } = m; await supabase.from('matches').update(r).eq('id', id) }
  const deleteMatch = async (id: number) => { await supabase.from('matches').delete().eq('id', id) }
  return { matches, loading, addMatch, updateMatch, deleteMatch }
}
