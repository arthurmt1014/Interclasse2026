import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { Card } from '@/lib/types'

export function useCards() {
  const { data: cards, loading } = useRealtimeTable<Card>('cards')
  const addCard    = async (c: Omit<Card,'id'>) => { await supabase.from('cards').insert(c) }
  const deleteCard = async (id: number) => { await supabase.from('cards').delete().eq('id', id) }
  return { cards, loading, addCard, deleteCard }
}
