import { useState } from "react"
import {
  UserCircle,
  Lock,
  Palette,
  ShieldCheck,
  Save,
  X,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react"
import { useCommunity } from "@/context/CommunityContext"
import { useCommunitySettings, type SettingsTab } from "@/hooks/useCommunitySettings"
import { CommunityGate } from "@/components/layout/CommunityGate"
import { PageHeader } from "@/components/layout/PageHeader"
import { PageLoader } from "@/components/layout/PageLoader"
import { SettingsSection, SettingsField } from "@/components/settings/SettingsSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KLYB_COLORS } from "@/constants/colors"
import { cn } from "@/lib/utils"

const NAV_ITEMS: { id: SettingsTab; label: string; description: string; icon: typeof UserCircle }[] = [
  { id: "profile", label: "Informations", description: "Nom et description", icon: UserCircle },
  { id: "access", label: "Accès", description: "Visibilité et tarifs", icon: Lock },
  { id: "appearance", label: "Apparence", description: "Logo et couleurs", icon: Palette },
  { id: "certification", label: "Certification", description: "Vérification KYC", icon: ShieldCheck },
]

function SaveFooter({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex w-full justify-end">
      <Button onClick={onSave} disabled={saving}>
        {saving ? <Spinner /> : <Save data-icon="inline-start" />}
        Enregistrer
      </Button>
    </div>
  )
}

const CommunitySettings = () => {
  const { selectedCommunityId, selectedCommunity } = useCommunity()
  const [tab, setTab] = useState<SettingsTab>("profile")
  const [domainInput, setDomainInput] = useState("")

  const {
    loading,
    saving,
    community,
    setCommunity,
    kycUrl,
    setKycUrl,
    kycDescription,
    setKycDescription,
    submittingKyc,
    associationType,
    setAssociationType,
    officialName,
    setOfficialName,
    registrationNumber,
    setRegistrationNumber,
    declarantRole,
    setDeclarantRole,
    representativeName,
    setRepresentativeName,
    headquartersAddress,
    setHeadquartersAddress,
    handleUpdate,
    handleSubmitKyc,
    addDomain,
    removeDomain,
  } = useCommunitySettings(selectedCommunityId)

  if (loading || !community) {
    return (
      <CommunityGate>
        <PageLoader label="Chargement des paramètres…" />
      </CommunityGate>
    )
  }

  const kycStatus = community.kycStatus || "none"
  const canSubmitKyc = ["none", "unsubmitted", "rejected", undefined].includes(kycStatus) || !kycStatus

  const kycStatusLabel: Record<string, string> = {
    verified: "Certifié",
    pending: "En cours d'examen",
    rejected: "Refusé",
    none: "Non soumis",
    unsubmitted: "Non soumis",
  }

  return (
    <CommunityGate>
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Paramètres"
        description={selectedCommunity?.name || community.name}
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-w-[140px] flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors lg:min-w-0 lg:w-full",
                  isActive
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
                <span className="hidden pl-6 text-xs text-muted-foreground lg:block">{item.description}</span>
              </button>
            )
          })}
        </nav>

        {/* Contenu */}
        <div className="min-w-0 flex-1 flex flex-col gap-6">
          {tab === "profile" && (
            <SettingsSection
              title="Informations générales"
              description="Ces informations sont visibles par les membres de votre communauté."
              footer={<SaveFooter saving={saving} onSave={handleUpdate} />}
            >
              <SettingsField label="Nom de la communauté">
                <Input
                  value={community.name || ""}
                  onChange={(e) => setCommunity({ ...community, name: e.target.value })}
                />
              </SettingsField>
              <SettingsField
                label="Description"
                hint="Présentez votre communauté en quelques lignes."
              >
                <Textarea
                  rows={4}
                  value={community.description || ""}
                  onChange={(e) => setCommunity({ ...community, description: e.target.value })}
                />
              </SettingsField>
            </SettingsSection>
          )}

          {tab === "access" && (
            <SettingsSection
              title="Accès et visibilité"
              description="Définissez qui peut rejoindre votre communauté et sous quelles conditions."
              footer={<SaveFooter saving={saving} onSave={handleUpdate} />}
            >
              <SettingsField label="Type d'accès">
                <Select
                  value={community.accessType || "public"}
                  onValueChange={(val) => setCommunity({ ...community, accessType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public — ouvert à tous</SelectItem>
                    <SelectItem value="private">Privé — sur invitation ou domaine email</SelectItem>
                    <SelectItem value="paid">Payant — adhésion payante</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              {community.accessType === "private" && (
                <SettingsField
                  label="Domaines email autorisés"
                  hint="Les utilisateurs avec une adresse vérifiée sur ces domaines rejoignent automatiquement."
                >
                  <div className="flex gap-2">
                    <Input
                      placeholder="exemple.fr"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addDomain(domainInput)
                          setDomainInput("")
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        addDomain(domainInput)
                        setDomainInput("")
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  {(community.allowedDomains?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {community.allowedDomains.map((domain: string) => (
                        <Badge key={domain} variant="secondary" className="gap-1 pr-1">
                          {domain}
                          <button
                            type="button"
                            onClick={() => removeDomain(domain)}
                            className="rounded-full p-0.5 hover:bg-muted"
                            aria-label={`Retirer ${domain}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </SettingsField>
              )}

              {community.accessType === "paid" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <SettingsField label="Tarif (€)">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={community.price ?? ""}
                      onChange={(e) =>
                        setCommunity({ ...community, price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </SettingsField>
                  <SettingsField label="Mode de facturation">
                    <Select
                      value={community.paymentType || "fixed"}
                      onValueChange={(val) => setCommunity({ ...community, paymentType: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Prix fixe unique</SelectItem>
                        <SelectItem value="subscription">Abonnement récurrent</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingsField>
                </div>
              )}
            </SettingsSection>
          )}

          {tab === "appearance" && (
            <SettingsSection
              title="Apparence"
              description="Personnalisez l'identité visuelle de votre communauté."
              footer={<SaveFooter saving={saving} onSave={handleUpdate} />}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
                  {community.logoUrl ? (
                    <img src={community.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  )}
                </div>
                <SettingsField
                  label="Logo"
                  hint="PNG ou SVG recommandé, 512×512 px."
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" disabled>
                    Changer le logo (bientôt)
                  </Button>
                </SettingsField>
              </div>

              <SettingsField label="Couleur principale">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={community.primaryColor || KLYB_COLORS.primary}
                    onChange={(e) => setCommunity({ ...community, primaryColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <Input
                    value={community.primaryColor || KLYB_COLORS.primary}
                    onChange={(e) => setCommunity({ ...community, primaryColor: e.target.value })}
                    className="max-w-[140px] font-mono text-sm"
                  />
                </div>
              </SettingsField>

              <SettingsField label="Couleur secondaire">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={community.secondaryColor || KLYB_COLORS.secondary}
                    onChange={(e) => setCommunity({ ...community, secondaryColor: e.target.value })}
                    className="size-10 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <Input
                    value={community.secondaryColor || KLYB_COLORS.secondary}
                    onChange={(e) => setCommunity({ ...community, secondaryColor: e.target.value })}
                    className="max-w-[140px] font-mono text-sm"
                  />
                </div>
              </SettingsField>
            </SettingsSection>
          )}

          {tab === "certification" && (
            <>
              <SettingsSection title="Statut de certification">
                <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl",
                      kycStatus === "verified" && "bg-success/10 text-success",
                      kycStatus === "pending" && "bg-warning/10 text-warning",
                      kycStatus === "rejected" && "bg-destructive/10 text-destructive",
                      !["verified", "pending", "rejected"].includes(kycStatus) && "bg-muted text-muted-foreground"
                    )}
                  >
                    <ShieldCheck />
                  </div>
                  <div>
                    <p className="font-semibold">{kycStatusLabel[kycStatus] || "Non soumis"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {kycStatus === "verified" &&
                        "Votre communauté est certifiée avec accès aux fonctionnalités de paiement."}
                      {kycStatus === "pending" &&
                        "Votre dossier est en cours d'examen (24 à 48 h en général)."}
                      {kycStatus === "rejected" &&
                        "Votre dossier a été refusé. Consultez le motif et soumettez à nouveau."}
                      {canSubmitKyc &&
                        "Soumettez vos documents officiels pour faire certifier votre communauté."}
                    </p>
                  </div>
                </div>

                {kycStatus === "rejected" && community.kycRejectionReason && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    <p className="font-medium">Motif du refus</p>
                    <p className="mt-1">{community.kycRejectionReason}</p>
                  </div>
                )}
              </SettingsSection>

              {canSubmitKyc ? (
                <>
                  <SettingsSection
                    title="Identité de l'entité"
                    description="Informations optionnelles mais recommandées pour accélérer la validation."
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <SettingsField label="Type d'entité">
                        <Select value={associationType} onValueChange={(v) => v && setAssociationType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student_org">Association étudiante (Loi 1901)</SelectItem>
                            <SelectItem value="bde">Bureau des Élèves (BDE)</SelectItem>
                            <SelectItem value="sports_club">Club sportif / AS</SelectItem>
                            <SelectItem value="independent">Indépendant / Entreprise</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                      <SettingsField label="Nom officiel">
                        <Input
                          placeholder="Association BDE ESGI Paris"
                          value={officialName}
                          onChange={(e) => setOfficialName(e.target.value)}
                        />
                      </SettingsField>
                      <SettingsField label="RNA / SIRET">
                        <Input
                          placeholder="W123456789"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          className="font-mono"
                        />
                      </SettingsField>
                      <SettingsField label="Rôle du déclarant">
                        <Select value={declarantRole} onValueChange={(v) => v && setDeclarantRole(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="president">Président(e)</SelectItem>
                            <SelectItem value="treasurer">Trésorier(e)</SelectItem>
                            <SelectItem value="secretary">Secrétaire</SelectItem>
                            <SelectItem value="board_member">Membre du bureau</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingsField>
                      <SettingsField label="Nom du signataire" className="sm:col-span-2">
                        <Input
                          placeholder="Jean Dupont"
                          value={representativeName}
                          onChange={(e) => setRepresentativeName(e.target.value)}
                        />
                      </SettingsField>
                      <SettingsField label="Siège social" className="sm:col-span-2">
                        <Input
                          placeholder="242 Rue du Faubourg Saint-Antoine, 75012 Paris"
                          value={headquartersAddress}
                          onChange={(e) => setHeadquartersAddress(e.target.value)}
                        />
                      </SettingsField>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    title="Documents"
                    description="Fournissez un lien vers votre justificatif et une description."
                    footer={
                      <div className="flex w-full justify-end">
                        <Button onClick={handleSubmitKyc} disabled={submittingKyc}>
                          {submittingKyc ? <Spinner /> : null}
                          Soumettre pour validation
                        </Button>
                      </div>
                    }
                  >
                    <SettingsField label="URL du document" hint="PDF ou image hébergé en ligne.">
                      <Input
                        placeholder="https://…"
                        value={kycUrl}
                        onChange={(e) => setKycUrl(e.target.value)}
                      />
                    </SettingsField>
                    <SettingsField label="Description du dossier">
                      <Textarea
                        rows={4}
                        placeholder="Décrivez votre structure, vos objectifs…"
                        value={kycDescription}
                        onChange={(e) => setKycDescription(e.target.value)}
                      />
                    </SettingsField>
                  </SettingsSection>
                </>
              ) : (
                <SettingsSection title="Dossier soumis">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["Type", associationType],
                      ["Nom officiel", officialName || community.officialName],
                      ["Immatriculation", registrationNumber || community.registrationNumber],
                      ["Signataire", representativeName || community.representativeName],
                      ["Siège", headquartersAddress || community.headquartersAddress],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {community.kycDescription && (
                    <SettingsField label="Description">
                      <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                        {community.kycDescription}
                      </p>
                    </SettingsField>
                  )}
                  {community.kycDocumentUrl && (
                    <SettingsField label="Document">
                      <a
                        href={community.kycDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        Voir le document
                        <ExternalLink className="size-3.5" />
                      </a>
                    </SettingsField>
                  )}
                </SettingsSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </CommunityGate>
  )
}

export default CommunitySettings
