import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { Team } from '@/lib/types'

export function useTeams() {
  const { data: teams, loading } = useRealtimeTable<Team>('teams')
  const addTeam    = async (t: Omit<Team,'id'>) => { await supabase.from('teams').insert(t) }
  const updateTeam = async (t: Team) => { const { id, ...r } = t; await supabase.from('teams').update(r).eq('id', id) }
  const deleteTeam = async (id: number) => { await supabase.from('teams').delete().eq('id', id) }
  return { teams, loading, addTeam, updateTeam, deleteTeam }
}