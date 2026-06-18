import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { communityService } from "../services/api"
import { useAuth } from "./AuthContext"

interface Community {
  id: string
  name: string
  description?: string
  coverImage?: string
  primaryColor?: string
  secondaryColor?: string
}

interface CommunityContextType {
  communities: Community[]
  selectedCommunityId: string | null
  selectedCommunity: Community | null
  setSelectedCommunityId: (id: string | null) => void
  loading: boolean
  pendingRequestsCount: number
  pendingAffiliationRequestsCount: number
  refreshCommunities: () => Promise<void>
  refreshPendingRequestsCount: () => Promise<void>
  refreshPendingAffiliationRequestsCount: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    localStorage.getItem("selected_community_id")
  )
  const [loading, setLoading] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingAffiliationRequestsCount, setPendingAffiliationRequestsCount] = useState(0)

  const fetchCommunities = async () => {
    if (!token) {
      setCommunities([])
      return
    }

    try {
      setLoading(true)
      const res = await communityService.getAll()
      setCommunities(res.data || [])
    } catch (err) {
      console.error("Failed to fetch communities", err)
    } finally {
      setLoading(false)
    }
  }

  const refreshPendingRequestsCount = useCallback(async () => {
    if (!selectedCommunityId || !token) {
      setPendingRequestsCount(0)
      return
    }
    try {
      const res = await communityService.getPendingRequests(selectedCommunityId)
      setPendingRequestsCount((res.data || []).length)
    } catch {
      setPendingRequestsCount(0)
    }
  }, [selectedCommunityId, token])

  const refreshPendingAffiliationRequestsCount = useCallback(async () => {
    if (!selectedCommunityId || !token) {
      setPendingAffiliationRequestsCount(0)
      return
    }
    try {
      const res = await communityService.getParentRequests(selectedCommunityId)
      setPendingAffiliationRequestsCount((res.data || []).length)
    } catch {
      setPendingAffiliationRequestsCount(0)
    }
  }, [selectedCommunityId, token])

  useEffect(() => {
    fetchCommunities()
  }, [token, user?.id])

  useEffect(() => {
    refreshPendingRequestsCount()
    refreshPendingAffiliationRequestsCount()
  }, [refreshPendingRequestsCount, refreshPendingAffiliationRequestsCount])

  useEffect(() => {
    if (selectedCommunityId) {
      localStorage.setItem("selected_community_id", selectedCommunityId)
    } else {
      localStorage.removeItem("selected_community_id")
    }
  }, [selectedCommunityId])

  const selectedCommunity = communities.find((c) => c.id === selectedCommunityId) || null

  useEffect(() => {
    if (selectedCommunity?.primaryColor) {
      document.documentElement.style.setProperty("--primary", selectedCommunity.primaryColor)
    } else {
      document.documentElement.style.setProperty("--primary", "#2A7B9B")
    }
  }, [selectedCommunity])

  return (
    <CommunityContext.Provider
      value={{
        communities,
        selectedCommunityId,
        selectedCommunity,
        setSelectedCommunityId,
        loading,
        pendingRequestsCount,
        pendingAffiliationRequestsCount,
        refreshCommunities: fetchCommunities,
        refreshPendingRequestsCount,
        refreshPendingAffiliationRequestsCount,
      }}
    >
      {children}
    </CommunityContext.Provider>
  )
}

export const useCommunity = () => {
  const context = useContext(CommunityContext)
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider")
  }
  return context
}
