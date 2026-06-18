import { useState, useEffect, useCallback } from "react"
import { communityService } from "@/services/api"
import { toast } from "sonner"

export interface AffiliationRequestCommunity {
  id: string
  name: string
  logo?: string
  description?: string
  user?: {
    name?: string
    email?: string
  }
}

export function useAffiliationRequests(communityId: string | null) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AffiliationRequestCommunity[]>([])

  const fetchRequests = useCallback(async () => {
    if (!communityId) {
      setRequests([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await communityService.getParentRequests(communityId)
      setRequests(res.data || [])
    } catch {
      toast.error("Impossible de charger les demandes d'affiliation")
    } finally {
      setLoading(false)
    }
  }, [communityId])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const respond = async (childId: string, action: "accept" | "reject") => {
    if (!communityId) return
    try {
      await communityService.respondToParentRequest(communityId, childId, action)
      toast.success(action === "accept" ? "Affiliation acceptée" : "Demande refusée")
      setRequests((prev) => prev.filter((r) => r.id !== childId))
    } catch {
      toast.error("Action impossible")
    }
  }

  return { loading, requests, respond, refresh: fetchRequests }
}
