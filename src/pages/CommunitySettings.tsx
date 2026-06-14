import { useState, useEffect } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { 
  Settings, 
  ShieldCheck, 
  LayoutGrid, 
  XCircle, 
  Image as ImageIcon,
  Save,
  Loader2,
  Trash2,
  Plus,
  ExternalLink
} from 'lucide-react';
import { communityService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const CommunitySettings = () => {
  const { selectedCommunityId } = useCommunity();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [kycUrl, setKycUrl] = useState('');
  const [kycDescription, setKycDescription] = useState('');
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Optional registration KYC fields
  const [associationType, setAssociationType] = useState('student_org');
  const [officialName, setOfficialName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [declarantRole, setDeclarantRole] = useState('president');
  const [representativeName, setRepresentativeName] = useState('');
  const [headquartersAddress, setHeadquartersAddress] = useState('');

  useEffect(() => {
    if (community?.kycDocumentUrl) {
      setKycUrl(community.kycDocumentUrl);
    }
    if (community?.kycDescription) {
      setKycDescription(community.kycDescription);
    }
    setAssociationType(community?.associationType || 'student_org');
    setOfficialName(community?.officialName || '');
    setRegistrationNumber(community?.registrationNumber || '');
    setDeclarantRole(community?.declarantRole || 'president');
    setRepresentativeName(community?.representativeName || '');
    setHeadquartersAddress(community?.headquartersAddress || '');
  }, [community]);

  useEffect(() => {
    if (selectedCommunityId) fetchData();
  }, [selectedCommunityId]);

  const fetchData = async () => {
    if (!selectedCommunityId) return;
    try {
      setLoading(true);
      const [commRes, membersRes, requestsRes, widgetsRes] = await Promise.all([
        communityService.getOne(selectedCommunityId),
        communityService.getMembers(selectedCommunityId),
        communityService.getPendingRequests(selectedCommunityId),
        communityService.getWidgets(selectedCommunityId).catch(() => ({ data: [] }))
      ]);
      const comm = commRes.data;
      if (comm) {
        comm.allowedDomains = comm.emailDomains?.map((d: any) => d.domain) || [];
      }
      setCommunity(comm);
      if (commRes.data?.kycDocumentUrl) setKycUrl(commRes.data.kycDocumentUrl);
      if (commRes.data?.kycDescription) setKycDescription(commRes.data.kycDescription);
      setMembers(membersRes.data || []);
      setPendingRequests(requestsRes.data || []);
      setWidgets(widgetsRes.data || [
        { id: 'spotify', name: 'Spotify Player', description: 'Partagez vos playlists.', enabled: true },
        { id: 'instagram', name: 'Feed Instagram', description: 'Affiche les derniers posts.', enabled: false },
        { id: 'gamification', name: 'Système de Points', description: 'Récompense l\'engagement.', enabled: true },
      ]);
    } catch (err) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const payload = {
        name: community.name,
        description: community.description,
        isPublic: community.accessType === 'public',
        accessType: community.accessType,
        price: community.accessType === 'paid' ? parseFloat(community.price) || 0 : null,
        paymentType: community.accessType === 'paid' ? community.paymentType : null,
        logo: community.logo,
        primaryColor: community.primaryColor,
        secondaryColor: community.secondaryColor,
        category: community.category,
        allowedDomains: community.accessType === 'private' ? community.allowedDomains : [],
        tags: community.tags?.map((t: any) => typeof t === 'string' ? t : t.name) || [],
      };
      await communityService.update(selectedCommunityId!, payload);
      toast.success('Mis à jour !');
    } catch (err) { 
      toast.error('Erreur lors de la mise à jour'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleRequest = async (userId: string, action: 'accept' | 'reject') => {
    try {
      await communityService.respondToRequest(selectedCommunityId!, userId, action);
      toast.success(action === 'accept' ? 'Accepté !' : 'Refusé');
      setPendingRequests(prev => prev.filter(r => r.userId !== userId));
    } catch (err) { toast.error('Erreur'); }
  };

  const handleSubmitKyc = async () => {
    if (!kycUrl.trim()) {
      toast.error('Veuillez saisir l\'URL du document de validation');
      return;
    }
    if (!kycDescription.trim()) {
      toast.error('Veuillez saisir une description pour votre dossier');
      return;
    }
    try {
      setSubmittingKyc(true);
      await communityService.submitKyc(
        selectedCommunityId!,
        kycUrl,
        kycDescription,
        associationType,
        officialName,
        registrationNumber,
        declarantRole,
        representativeName,
        headquartersAddress
      );
      toast.success('Dossier KYC soumis avec succès !');
      setCommunity({
        ...community,
        kycStatus: 'pending',
        kycDocumentUrl: kycUrl,
        kycDescription: kycDescription,
        kycRejectionReason: null,
        associationType,
        officialName,
        registrationNumber,
        declarantRole,
        representativeName,
        headquartersAddress
      });
    } catch (err) {
      toast.error('Erreur lors de la soumission du KYC');
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (!selectedCommunityId) return <div className="flex flex-col items-center justify-center min-h-[60vh] opacity-30"><Settings size={48} /><h2 className="text-xl font-bold mt-4">Sélectionnez une communauté</h2></div>;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-primary opacity-40" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{community?.name}</h2>
          <p className="text-xs text-muted-foreground font-medium">Paramètres de la communauté.</p>
        </div>
        <Button onClick={handleUpdate} disabled={saving} size="sm" className="h-9 px-5 rounded-xl font-bold gap-2 shadow-md shadow-primary/10">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="h-10 bg-gray-100/50 rounded-lg p-1 border border-gray-200/50 mb-6 w-fit">
          <TabsTrigger value="general" className="rounded-md font-bold px-5 text-[10px] uppercase tracking-tight h-full data-[state=active]:bg-white data-[state=active]:text-[#247596] data-[state=active]:shadow-sm transition-all duration-200">Identité</TabsTrigger>
          <TabsTrigger value="members" className="rounded-md font-bold px-5 text-[10px] uppercase tracking-tight h-full data-[state=active]:bg-white data-[state=active]:text-[#247596] data-[state=active]:shadow-sm transition-all duration-200">Équipe</TabsTrigger>
          <TabsTrigger value="widgets" className="rounded-md font-bold px-5 text-[10px] uppercase tracking-tight h-full data-[state=active]:bg-white data-[state=active]:text-[#247596] data-[state=active]:shadow-sm transition-all duration-200">Modules</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-md font-bold px-5 text-[10px] uppercase tracking-tight h-full data-[state=active]:bg-white data-[state=active]:text-[#247596] data-[state=active]:shadow-sm transition-all duration-200 relative">
            Requêtes {pendingRequests.length > 0 && <span className="ml-1.5 bg-primary text-white text-[8px] px-1 rounded-full">{pendingRequests.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-md font-bold px-5 text-[10px] uppercase tracking-tight h-full data-[state=active]:bg-white data-[state=active]:text-[#247596] data-[state=active]:shadow-sm transition-all duration-200">
            KYC
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl border border-gray-50 overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold">Branding</CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tight opacity-50">Identité visuelle</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nom</Label>
                    <Input value={community?.name} onChange={(e) => setCommunity({...community, name: e.target.value})} className="h-9 text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Description</Label>
                    <textarea value={community?.description} onChange={(e) => setCommunity({...community, description: e.target.value})} className="w-full min-h-[80px] rounded-lg border border-gray-100 bg-gray-50/30 px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary/20 outline-none resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Type d'accès</Label>
                    <select
                      value={community?.accessType || 'public'}
                      onChange={(e) => setCommunity({...community, accessType: e.target.value})}
                      className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="public">Public</option>
                      <option value="private">Privé</option>
                      <option value="paid">Payant</option>
                    </select>
                  </div>
                  {community?.accessType === 'private' && (
                    <div className="space-y-2 pt-2 border border-dashed border-gray-100 rounded-xl p-3 bg-gray-50/20">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Restreindre par domaine email</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ex: esgi.fr" 
                          id="new-domain-input"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                              if (val && !community.allowedDomains?.includes(val)) {
                                const newDomains = [...(community.allowedDomains || []), val];
                                setCommunity({ ...community, allowedDomains: newDomains });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                          className="h-8 text-xs font-semibold"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="h-8 text-[10px] uppercase font-bold px-3"
                          onClick={() => {
                            const input = document.getElementById('new-domain-input') as HTMLInputElement;
                            const val = input?.value.trim().toLowerCase();
                            if (val && !community.allowedDomains?.includes(val)) {
                              const newDomains = [...(community.allowedDomains || []), val];
                              setCommunity({ ...community, allowedDomains: newDomains });
                              input.value = '';
                            }
                          }}
                        >
                          Ajouter
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Les utilisateurs possédant une adresse email vérifiée sur ces domaines rejoindront la communauté automatiquement.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {community.allowedDomains?.map((domain: string) => (
                          <Badge 
                            key={domain} 
                            variant="secondary" 
                            className="text-[10px] font-bold py-0.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md gap-1 flex items-center"
                          >
                            {domain}
                            <XCircle 
                              size={12} 
                              className="text-gray-400 hover:text-red-500 cursor-pointer shrink-0" 
                              onClick={() => {
                                const newDomains = community.allowedDomains.filter((d: string) => d !== domain);
                                setCommunity({ ...community, allowedDomains: newDomains });
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(community?.accessType === 'paid') && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Tarif (€)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={community?.price || ''} 
                          onChange={(e) => setCommunity({...community, price: parseFloat(e.target.value) || 0})} 
                          className="h-9 text-xs font-bold" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Facturation</Label>
                        <select
                          value={community?.paymentType || 'fixed'}
                          onChange={(e) => setCommunity({...community, paymentType: e.target.value})}
                          className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-primary/50 transition-colors"
                        >
                          <option value="fixed">Prix fixe</option>
                          <option value="subscription">Abonnement</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group shrink-0">
                      {community?.logoUrl ? <img src={community.logoUrl} className="h-full w-full object-cover" /> : <ImageIcon size={24} className="text-muted-foreground opacity-30" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-[11px] uppercase tracking-wider">Logo Officiel</h4>
                      <p className="text-[10px] text-muted-foreground leading-tight">PNG ou SVG (512x512px).</p>
                      <Button variant="outline" size="sm" className="h-7 px-3 rounded-md font-bold text-[9px] uppercase mt-2">Changer</Button>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Couleur Principale</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={community?.primaryColor || '#247596'} onChange={(e) => setCommunity({...community, primaryColor: e.target.value})} className="h-8 w-8 rounded-md cursor-pointer border-none bg-transparent" />
                      <Input value={community?.primaryColor || '#247596'} onChange={(e) => setCommunity({...community, primaryColor: e.target.value})} className="h-8 font-mono text-[10px] w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl border border-gray-50 overflow-hidden">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Équipe Administrative</CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-tight opacity-50">Gestion des droits.</CardDescription>
              </div>
              <Button size="sm" className="h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider gap-1.5"><Plus size={14} /> Inviter</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="grid gap-2">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px]">{member.user?.name?.substring(0, 1)}</div>
                      <div>
                        <p className="font-bold text-xs">{member.user?.name}</p>
                        <p className="text-[9px] text-muted-foreground font-medium opacity-60">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="h-6 px-2 text-[8px] font-bold uppercase tracking-wider bg-white border-gray-100">{member.role?.name || 'Membre'}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widgets" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id} className={cn("border-none shadow-sm transition-all rounded-xl overflow-hidden border", widget.enabled ? "bg-white border-primary/20" : "bg-gray-50 opacity-60 grayscale")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn("p-1.5 rounded-lg", widget.enabled ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-400")}>
                    {widget.id === 'spotify' && <LayoutGrid size={16} />}
                    {widget.id === 'instagram' && <ImageIcon size={16} />}
                    {widget.id === 'gamification' && <ShieldCheck size={16} />}
                  </div>
                  <button onClick={() => setWidgets(prev => prev.map(w => w.id === widget.id ? {...w, enabled: !w.enabled} : w))} className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all", widget.enabled ? "bg-primary text-white" : "bg-gray-200 text-gray-500")}>{widget.enabled ? 'On' : 'Off'}</button>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold">{widget.name}</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{widget.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl border border-gray-50 overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold">Demandes d'Adhésion</CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tight opacity-50">File d'attente.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {pendingRequests.length === 0 ? <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">Aucune demande</div> : (
                <div className="grid gap-2">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/50 border border-transparent hover:border-gray-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[11px]">{request.user?.name?.substring(0, 1)}</div>
                        <div><p className="font-bold text-sm">{request.user?.name}</p><p className="text-[10px] text-muted-foreground opacity-60">{request.user?.email}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleRequest(request.userId, 'reject')} variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/5"><XCircle size={16} /></Button>
                        <Button onClick={() => handleRequest(request.userId, 'accept')} size="sm" className="h-8 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-sm">Accepter</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl border border-gray-50 overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold">Certification Officielle de la Communauté</CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tight opacity-50">Processus de vérification KYC</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-6">
              {/* Statut actuel */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                  community?.kycStatus === 'verified' ? "bg-green-50 text-green-500" :
                  community?.kycStatus === 'pending' ? "bg-amber-50 text-amber-500" :
                  community?.kycStatus === 'rejected' ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"
                )}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide">
                    Statut : {
                      community?.kycStatus === 'verified' ? 'Certifié' :
                      community?.kycStatus === 'pending' ? 'Examen en cours' :
                      community?.kycStatus === 'rejected' ? 'Rejeté' : 'Non soumis'
                    }
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {community?.kycStatus === 'verified' && 'Votre communauté est certifiée. Vous bénéficiez d\'une visibilité accrue et de toutes les fonctionnalités de paiement.'}
                    {community?.kycStatus === 'pending' && 'Nos administrateurs examinent actuellement vos documents. Ce processus prend généralement 24 à 48 heures.'}
                    {community?.kycStatus === 'rejected' && 'La validation a été refusée. Veuillez vérifier les détails ci-dessous.'}
                    {(!community?.kycStatus || community?.kycStatus === 'none' || community?.kycStatus === 'unsubmitted') && 'Soumettez vos documents officiels (statuts d\'association, pièce d\'identité) pour faire certifier votre communauté.'}
                  </p>
                </div>
              </div>

              {/* Motif de rejet */}
              {community?.kycStatus === 'rejected' && community?.kycRejectionReason && (
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100 text-red-700 space-y-1">
                  <h5 className="text-[10px] font-black uppercase tracking-wider">Motif du refus</h5>
                  <p className="text-xs font-medium">"{community.kycRejectionReason}"</p>
                </div>
              )}

              {/* Formulaire de soumission */}
              {(community?.kycStatus === 'none' || community?.kycStatus === 'unsubmitted' || !community?.kycStatus || community?.kycStatus === 'rejected') ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Type d'entité (Optionnel)</Label>
                      <select
                        value={associationType}
                        onChange={(e) => setAssociationType(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-primary/50 transition-colors"
                      >
                        <option value="student_org">Association étudiante (Loi 1901)</option>
                        <option value="bde">Bureau des Élèves (BDE)</option>
                        <option value="sports_club">Club sportif / AS</option>
                        <option value="independent">Indépendant / Entreprise</option>
                        <option value="other">Autre structure</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nom officiel de l'entité (Optionnel)</Label>
                      <Input 
                        placeholder="Ex: Association BDE ESGI Paris" 
                        value={officialName}
                        onChange={(e) => setOfficialName(e.target.value)}
                        className="h-9 text-xs font-semibold" 
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Numéro d'immatriculation RNA / SIRET (Optionnel)</Label>
                      <Input 
                        placeholder="Ex: W123456789 ou Siret" 
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="h-9 text-xs font-semibold font-mono" 
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Rôle du déclarant (Optionnel)</Label>
                      <select
                        value={declarantRole}
                        onChange={(e) => setDeclarantRole(e.target.value)}
                        className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-primary/50 transition-colors"
                      >
                        <option value="president">Président(e)</option>
                        <option value="treasurer">Trésorier(e)</option>
                        <option value="secretary">Secrétaire</option>
                        <option value="board_member">Membre du bureau</option>
                        <option value="other">Autre / Représentant</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Nom complet du signataire / déclarant (Optionnel)</Label>
                      <Input 
                        placeholder="Ex: Jean Dupont" 
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        className="h-9 text-xs font-semibold" 
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Adresse du siège social (Optionnel)</Label>
                      <Input 
                        placeholder="Ex: 242 Rue du Faubourg Saint-Antoine, 75012 Paris" 
                        value={headquartersAddress}
                        onChange={(e) => setHeadquartersAddress(e.target.value)}
                        className="h-9 text-xs font-semibold" 
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">URL du Document de Justification (PDF, Image...) (Optionnel)</Label>
                      <Input 
                        placeholder="https://example.com/justificatif.pdf" 
                        value={kycUrl}
                        onChange={(e) => setKycUrl(e.target.value)}
                        className="h-9 text-xs font-bold" 
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Description ou texte d'accompagnement *</Label>
                      <textarea 
                        placeholder="Décrivez votre association, vos objectifs, et justifiez votre demande de certification..." 
                        value={kycDescription}
                        onChange={(e) => setKycDescription(e.target.value)}
                        className="w-full min-h-[100px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none resize-none focus:border-primary/50 transition-colors" 
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSubmitKyc} 
                    disabled={submittingKyc}
                    size="sm" 
                    className="h-9 px-5 rounded-xl font-bold gap-2 shadow-md shadow-primary/10"
                  >
                    {submittingKyc && <Loader2 size={14} className="animate-spin" />}
                    Soumettre pour validation
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Type d'entité</span>
                      <span className="font-semibold text-gray-800">
                        {community?.associationType === 'student_org' ? 'Association étudiante (Loi 1901)' :
                         community?.associationType === 'bde' ? 'Bureau des Élèves (BDE)' :
                         community?.associationType === 'sports_club' ? 'Club sportif / AS' :
                         community?.associationType === 'independent' ? 'Indépendant / Entreprise' : 'Non spécifié'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Nom officiel</span>
                      <span className="font-semibold text-gray-800">{community?.officialName || 'Non spécifié'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Immatriculation (RNA/SIRET)</span>
                      <span className="font-semibold text-gray-800 font-mono">{community?.registrationNumber || 'Non spécifié'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Déclarant / Rôle</span>
                      <span className="font-semibold text-gray-800">
                        {community?.representativeName || 'Non spécifié'} 
                        {community?.declarantRole ? ` (${
                          community.declarantRole === 'president' ? 'Président(e)' :
                          community.declarantRole === 'treasurer' ? 'Trésorier(e)' :
                          community.declarantRole === 'secretary' ? 'Secrétaire' :
                          community.declarantRole === 'board_member' ? 'Membre du bureau' : 'Autre'
                        })` : ''}
                      </span>
                    </div>
                    <div className="sm:col-span-2 border-t border-gray-200/50 pt-2">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Adresse du siège social</span>
                      <span className="font-semibold text-gray-800">{community?.headquartersAddress || 'Non spécifiée'}</span>
                    </div>
                  </div>

                  {community?.kycDescription && (
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Description soumise</Label>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                        {community.kycDescription}
                      </div>
                    </div>
                  )}

                  {community?.kycDocumentUrl && (
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Document soumis</Label>
                      <div className="text-xs font-bold text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 truncate flex items-center justify-between">
                        <a href={community.kycDocumentUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate mr-2">
                          {community.kycDocumentUrl}
                        </a>
                        <ExternalLink size={12} className="text-gray-400 shrink-0" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunitySettings;
