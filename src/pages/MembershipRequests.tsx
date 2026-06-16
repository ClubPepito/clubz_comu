import { Check, XCircle, UserPlus } from "lucide-react"
import { useCommunity } from "@/context/CommunityContext"
import { useMembershipRequests } from "@/hooks/useMembershipRequests"
import { CommunityGate } from "@/components/layout/CommunityGate"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageLoader } from "@/components/layout/PageLoader"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function MembershipRequests() {
  const { selectedCommunityId, selectedCommunity, refreshPendingRequestsCount } = useCommunity()
  const { loading, requests, respond: respondRequest } = useMembershipRequests(selectedCommunityId)

  const respond = async (userId: string, action: "accept" | "reject") => {
    await respondRequest(userId, action)
    refreshPendingRequestsCount()
  }

  return (
    <CommunityGate
      title="Adhésions"
      description="Sélectionnez une communauté pour gérer les demandes d'adhésion."
    >
      <div className="flex flex-col gap-8 pb-12">
        <PageHeader
          title="Adhésions"
          description={
            selectedCommunity
              ? `Demandes en attente pour ${selectedCommunity.name}`
              : "Validez les personnes souhaitant rejoindre votre communauté"
          }
          actions={
            requests.length > 0 ? (
              <Badge variant="secondary" className="text-sm">
                {requests.length} en attente
              </Badge>
            ) : undefined
          }
        />

        {loading ? (
          <PageLoader label="Chargement des demandes…" />
        ) : requests.length === 0 ? (
          <Empty className="border-border bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserPlus />
              </EmptyMedia>
              <EmptyTitle>Aucune demande en attente</EmptyTitle>
              <EmptyDescription>
                Lorsqu'une personne demande à rejoindre votre communauté, elle apparaîtra ici
                pour validation.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <SettingsSection
            title="Demandes à traiter"
            description="Acceptez ou refusez chaque demande. Les membres acceptés apparaîtront dans la page Membres."
          >
            <div className="flex flex-col gap-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-11">
                      <AvatarImage src={request.user?.profileImage} />
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {request.user?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user?.name || "Utilisateur"}</p>
                      <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => respond(request.userId, "reject")}
                    >
                      <XCircle data-icon="inline-start" />
                      Refuser
                    </Button>
                    <Button size="sm" onClick={() => respond(request.userId, "accept")}>
                      <Check data-icon="inline-start" />
                      Accepter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>
        )}
      </div>
    </CommunityGate>
  )
}
