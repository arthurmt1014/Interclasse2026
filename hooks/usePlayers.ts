import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { Player } from '@/lib/types'

export function usePlayers() {
  const { data: players, loading } = useRealtimeTable<Player>('players')
  const addPlayer    = async (p: Omit<Player,'id'>) => { await supabase.from('players').insert(p) }
  const updatePlayer = async (p: Player) => { const { id, ...r } = p; await supabase.from('players').update(r).eq('id', id) }
  const deletePlayer = async (id: number) => { await supabase.from('players').delete().eq('id', id) }
  return { players, loading, addPlayer, updatePlayer, deletePlayer }
}