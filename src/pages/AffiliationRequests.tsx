import { Check, GitBranch, XCircle } from "lucide-react"
import { useCommunity } from "@/context/CommunityContext"
import { useAffiliationRequests } from "@/hooks/useAffiliationRequests"
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

export default function AffiliationRequests() {
  const { selectedCommunityId, selectedCommunity, refreshPendingAffiliationRequestsCount } =
    useCommunity()
  const { loading, requests, respond: respondRequest } = useAffiliationRequests(selectedCommunityId)

  const respond = async (childId: string, action: "accept" | "reject") => {
    await respondRequest(childId, action)
    refreshPendingAffiliationRequestsCount()
  }

  return (
    <CommunityGate
      title="Affiliations"
      description="Sélectionnez une communauté pour gérer les demandes d'affiliation reçues."
    >
      <div className="flex flex-col gap-8 pb-12">
        <PageHeader
          title="Affiliations"
          description={
            selectedCommunity
              ? `Demandes reçues par ${selectedCommunity.name}`
              : "Acceptez ou refusez les communautés souhaitant s'affilier à la vôtre"
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
                <GitBranch />
              </EmptyMedia>
              <EmptyTitle>Aucune demande d'affiliation</EmptyTitle>
              <EmptyDescription>
                Lorsqu'une communauté demande à s'affilier à la vôtre, la demande apparaîtra ici
                pour validation.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <SettingsSection
            title="Demandes à traiter"
            description="Acceptez ou refusez chaque demande. Les communautés acceptées deviendront des communautés enfants."
          >
            <div className="flex flex-col gap-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-11 rounded-lg">
                      <AvatarImage src={request.logo} />
                      <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">
                        {request.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Souhaite s'affilier à votre communauté
                        {request.user?.name ? ` • demandé par ${request.user.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => respond(request.id, "reject")}
                    >
                      <XCircle data-icon="inline-start" />
                      Refuser
                    </Button>
                    <Button size="sm" onClick={() => respond(request.id, "accept")}>
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
