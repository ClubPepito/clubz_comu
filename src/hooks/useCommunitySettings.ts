import { useState, useEffect, useCallback } from "react"
import { communityService } from "@/services/api"
import { toast } from "sonner"

export type SettingsTab = "profile" | "access" | "appearance" | "certification"

export function useCommunitySettings(communityId: string | null) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [community, setCommunity] = useState<any>(null)

  const [kycUrl, setKycUrl] = useState("")
  const [kycDescription, setKycDescription] = useState("")
  const [submittingKyc, setSubmittingKyc] = useState(false)
  const [associationType, setAssociationType] = useState("student_org")
  const [officialName, setOfficialName] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [declarantRole, setDeclarantRole] = useState("president")
  const [representativeName, setRepresentativeName] = useState("")
  const [headquartersAddress, setHeadquartersAddress] = useState("")

  const syncKycFields = useCallback((comm: any) => {
    if (comm?.kycDocumentUrl) setKycUrl(comm.kycDocumentUrl)
    if (comm?.kycDescription) setKycDescription(comm.kycDescription)
    setAssociationType(comm?.associationType || "student_org")
    setOfficialName(comm?.officialName || "")
    setRegistrationNumber(comm?.registrationNumber || "")
    setDeclarantRole(comm?.declarantRole || "president")
    setRepresentativeName(comm?.representativeName || "")
    setHeadquartersAddress(comm?.headquartersAddress || "")
  }, [])

  const fetchData = useCallback(async () => {
    if (!communityId) return
    try {
      setLoading(true)
      const commRes = await communityService.getOne(communityId)
      const comm = commRes.data
      if (comm) {
        comm.allowedDomains = comm.emailDomains?.map((d: any) => d.domain) || comm.allowedDomains || []
      }
      setCommunity(comm)
      syncKycFields(comm)
    } catch {
      toast.error("Impossible de charger les paramètres")
    } finally {
      setLoading(false)
    }
  }, [communityId, syncKycFields])

  useEffect(() => {
    if (communityId) fetchData()
  }, [communityId, fetchData])

  const buildUpdatePayload = () => ({
    name: community.name,
    description: community.description,
    isPublic: community.accessType === "public",
    accessType: community.accessType,
    price: community.accessType === "paid" ? parseFloat(community.price) || 0 : null,
    paymentType: community.accessType === "paid" ? community.paymentType : null,
    logo: community.logo,
    primaryColor: community.primaryColor,
    secondaryColor: community.secondaryColor,
    category: community.category,
    allowedDomains: community.accessType === "private" ? community.allowedDomains || [] : [],
    tags: community.tags?.map((t: any) => (typeof t === "string" ? t : t.name)) || [],
  })

  const handleUpdate = async () => {
    if (!communityId || !community) return
    try {
      setSaving(true)
      await communityService.update(communityId, buildUpdatePayload())
      toast.success("Paramètres enregistrés")
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitKyc = async () => {
    if (!communityId) return
    if (!kycUrl.trim()) {
      toast.error("URL du document requise")
      return
    }
    if (!kycDescription.trim()) {
      toast.error("Description requise")
      return
    }
    try {
      setSubmittingKyc(true)
      await communityService.submitKyc(
        communityId,
        kycUrl,
        kycDescription,
        associationType,
        officialName,
        registrationNumber,
        declarantRole,
        representativeName,
        headquartersAddress
      )
      toast.success("Dossier KYC soumis")
      setCommunity({
        ...community,
        kycStatus: "pending",
        kycDocumentUrl: kycUrl,
        kycDescription,
        kycRejectionReason: null,
        associationType,
        officialName,
        registrationNumber,
        declarantRole,
        representativeName,
        headquartersAddress,
      })
    } catch {
      toast.error("Erreur lors de la soumission")
    } finally {
      setSubmittingKyc(false)
    }
  }

  const addDomain = (domain: string) => {
    const val = domain.trim().toLowerCase()
    if (!val || community.allowedDomains?.includes(val)) return
    setCommunity({
      ...community,
      allowedDomains: [...(community.allowedDomains || []), val],
    })
  }

  const removeDomain = (domain: string) => {
    setCommunity({
      ...community,
      allowedDomains: (community.allowedDomains || []).filter((d: string) => d !== domain),
    })
  }

  return {
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
    refresh: fetchData,
  }
}
