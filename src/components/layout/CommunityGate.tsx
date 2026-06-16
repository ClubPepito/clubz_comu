import { Users } from "lucide-react"
import { useCommunity } from "@/context/CommunityContext"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface CommunityGateProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function CommunityGate({
  children,
  title = "Sélectionnez une communauté",
  description = "Choisissez une communauté dans la barre latérale pour accéder à cette page.",
}: CommunityGateProps) {
  const { selectedCommunityId } = useCommunity()

  if (!selectedCommunityId) {
    return (
      <Empty className="min-h-[50vh] border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <>{children}</>
}
