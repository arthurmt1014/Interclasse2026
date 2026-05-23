'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Team {
  id: number
  nome: string
  turma?: string
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([])

  async function fetchTeams() {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('id')

    if (data) setTeams(data)
  }

  useEffect(() => {
    fetchTeams()

    const channel = supabase
      .channel('teams-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        () => {
          fetchTeams()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { teams }
}