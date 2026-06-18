import { useState, useEffect, useCallback } from 'react'
import { eventService } from '@/services/api'
import { useCommunity } from '@/context/CommunityContext'
import { toast } from 'sonner'
import type { Event } from '@/types/event'

export function useEvents() {
  const { selectedCommunityId } = useCommunity()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await eventService.getAll(selectedCommunityId)
      setEvents(res.data || [])
    } catch (err) {
      console.error('Failed to fetch events', err)
      toast.error('Erreur lors du chargement des événements')
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const deleteEvent = useCallback(async (id: string) => {
    await eventService.delete(id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const duplicateEvent = useCallback(async (id: string) => {
    await eventService.duplicate(id)
    await fetchEvents()
  }, [fetchEvents])

  return { events, loading, fetchEvents, deleteEvent, duplicateEvent }
}
