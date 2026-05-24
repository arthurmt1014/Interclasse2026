'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeTable<T extends { id?: number }>(table: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: rows, error } = await supabase
      .from(table)
      .select('*')

    if (!error && rows) {
      setData(rows as T[])
    }

    setLoading(false)
  }, [table])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData, table])

  return { data, loading, refetch: fetchData }
}