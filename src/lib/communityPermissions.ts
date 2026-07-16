/** Permissions that grant access to the community admin panel. */
export const ADMIN_EDIT_PERMISSIONS = [
  "all",
  "manage_settings",
  "manage_roles",
  "manage_members",
  "manage_content",
  "manage_pages",
  "create_events",
  "moderate",
  "view_analytics",
  "manage_event_checkin",
] as const

type CommunityLike = {
  userId?: string
  userMembership?: {
    role?: {
      permissions?: string[]
    } | null
  } | null
}

/**
 * True when the user can manage/edit the community in admin
 * (creator, or role with at least one admin permission).
 */
export function canEditCommunity(
  community: CommunityLike,
  userId?: string | null,
): boolean {
  if (userId && community.userId && community.userId === userId) {
    return true
  }

  const permissions = community.userMembership?.role?.permissions ?? []
  if (permissions.includes("all")) return true

  return ADMIN_EDIT_PERMISSIONS.some(
    (perm) => perm !== "all" && permissions.includes(perm),
  )
}
