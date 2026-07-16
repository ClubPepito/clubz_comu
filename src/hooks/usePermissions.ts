import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCommunity } from '@/context/CommunityContext'

export interface CommunityPermissions {
  create_events: boolean
  /** Mapped from API `create_events` (no dedicated edit_events on API). */
  edit_events: boolean
  /** Mapped from API `create_events` (no dedicated delete_events on API). */
  delete_events: boolean
  manage_event_checkin: boolean
  manage_members: boolean
  manage_roles: boolean
  manage_settings: boolean
}

const DENIED: CommunityPermissions = {
  create_events: false,
  edit_events: false,
  delete_events: false,
  manage_event_checkin: false,
  manage_members: false,
  manage_roles: false,
  manage_settings: false,
}

const FULL: CommunityPermissions = {
  create_events: true,
  edit_events: true,
  delete_events: true,
  manage_event_checkin: true,
  manage_members: true,
  manage_roles: true,
  manage_settings: true,
}

function hasPerm(perms: string[], key: string): boolean {
  return perms.includes('all') || perms.includes(key)
}

/**
 * Resolves permissions from `GET /communities/me` → `userMembership.role.permissions`.
 * No separate `/my-role` endpoint exists on the API.
 */
export function usePermissions() {
  const { user } = useAuth()
  const { selectedCommunity } = useCommunity()

  const permissions = useMemo((): CommunityPermissions => {
    if (!selectedCommunity || !user) return DENIED

    if (selectedCommunity.userId && selectedCommunity.userId === user.id) {
      return FULL
    }

    const perms = selectedCommunity.userMembership?.role?.permissions ?? []
    if (perms.includes('all')) return FULL

    const canManageEvents = hasPerm(perms, 'create_events')

    return {
      create_events: canManageEvents,
      edit_events: canManageEvents,
      delete_events: canManageEvents,
      manage_event_checkin: hasPerm(perms, 'manage_event_checkin'),
      manage_members: hasPerm(perms, 'manage_members'),
      manage_roles: hasPerm(perms, 'manage_roles'),
      manage_settings: hasPerm(perms, 'manage_settings'),
    }
  }, [selectedCommunity, user])

  return { permissions, loading: false }
}
