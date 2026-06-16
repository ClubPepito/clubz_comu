import { useState, useEffect, useCallback } from "react"
import { communityService } from "@/services/api"
import { toast } from "sonner"

export function useMembershipRequests(communityId: string | null) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])

  const fetchRequests = useCallback(async () => {
    if (!communityId) {
      setRequests([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await communityService.getPendingRequests(communityId)
      setRequests(res.data || [])
    } catch {
      toast.error("Impossible de charger les demandes")
    } finally {
      setLoading(false)
    }
  }, [communityId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const respond = async (userId: string, action: "accept" | "reject") => {
    if (!communityId) return
    try {
      await communityService.respondToRequest(communityId, userId, action)
      toast.success(action === "accept" ? "Membre accepté" : "Demande refusée")
      setRequests((prev) => prev.filter((r) => r.userId !== userId))
    } catch {
      toast.error("Action impossible")
    }
  }

  return { loading, requests, respond, refresh: fetchRequests }
}
