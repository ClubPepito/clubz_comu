import { useState, useEffect } from 'react'
import { communityService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useCommunity } from '@/context/CommunityContext'

export interface CommunityPermissions {
  create_events: boolean
  edit_events: boolean
  delete_events: boolean
  manage_event_checkin: boolean
  manage_members: boolean
  manage_roles: boolean
  manage_settings: boolean
}

const DEFAULT_PERMISSIONS: CommunityPermissions = {
  create_events: true,
  edit_events: true,
  delete_events: true,
  manage_event_checkin: true,
  manage_members: true,
  manage_roles: true,
  manage_settings: true,
}

export function usePermissions() {
  const { user } = useAuth()
  const { selectedCommunityId } = useCommunity()
  const [permissions, setPermissions] = useState<CommunityPermissions>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedCommunityId || !user) {
      setPermissions(DEFAULT_PERMISSIONS)
      return
    }

    const fetchPermissions = async () => {
      setLoading(true)
      try {
        const res = await communityService.getMyRole(selectedCommunityId)
        const role = res.data
        // The API returns a role object with a `permissions` array of strings
        const perms: string[] = role?.permissions || []

        // If the user is an owner/admin we grant everything
        if (role?.isOwner || role?.name === 'owner' || role?.name === 'admin') {
          setPermissions(DEFAULT_PERMISSIONS)
          return
        }

        setPermissions({
          create_events: perms.includes('create_events'),
          edit_events: perms.includes('edit_events'),
          delete_events: perms.includes('delete_events'),
          manage_event_checkin: perms.includes('manage_event_checkin'),
          manage_members: perms.includes('manage_members'),
          manage_roles: perms.includes('manage_roles'),
          manage_settings: perms.includes('manage_settings'),
        })
      } catch {
        // If the endpoint doesn't exist or fails, default to full access
        setPermissions(DEFAULT_PERMISSIONS)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [selectedCommunityId, user])

  return { permissions, loading }
}
