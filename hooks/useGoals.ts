import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { Goal } from '@/lib/types'

export function useGoals() {
  const { data: goals, loading } = useRealtimeTable<Goal>('goals')
  const addGoal    = async (g: Omit<Goal,'id'>) => { await supabase.from('goals').insert(g) }
  const deleteGoal = async (id: number) => { await supabase.from('goals').delete().eq('id', id) }
  return { goals, loading, addGoal, deleteGoal }
}