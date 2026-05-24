import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '@/lib/supabase'
import { KnockoutMatch } from '@/lib/types'

export function useKnockout() {
  const { data: knockout, loading } = useRealtimeTable<KnockoutMatch>('knockout_matches')
  const setKnockout = async (matches: Omit<KnockoutMatch,'id'>[]) => {
    await supabase.from('knockout_matches').delete().neq('id', 0)
    await supabase.from('knockout_matches').insert(matches)
  }
  const updateKnockout = async (k: KnockoutMatch) => {
    const { id, ...r } = k
    await supabase.from('knockout_matches').update(r).eq('id', id)
  }
  return { knockout, loading, setKnockout, updateKnockout }
}