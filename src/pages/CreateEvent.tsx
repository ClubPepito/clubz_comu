import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCommunity } from '../context/CommunityContext';
import {
  Sparkles,
  Ticket,
  Eye,
  Plus,
  Trash2,
  MapPin,
  Globe,
  Lock,
  Loader2,
  HelpCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { eventService, storageService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { selectedCommunityId, communities } = useCommunity();
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiUrl, setAiUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    visibility: 'public',
    communityId: selectedCommunityId || '',
    image: '',
    isRecurring: false,
    recurrenceRule: '',
    isOnline: false,
    meetingLink: '',
    shortLink: '',
    tags: [] as string[],
    coHostIds: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    ticketTypes: [
      { name: 'Regular', price: 0, totalQuantity: 100, order: 0, isHidden: false, points: 10, description: '', salesStartDate: '', salesEndDate: '' }
    ],
    customFields: [] as any[]
  });

  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (addressSearch.length > 2 && addressSearch !== formData.location) {
        handleAddressSearch();
      } else {
        setAddressSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [addressSearch]);

  const handleAddressSearch = async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&limit=5&addressdetails=1`);
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (err) { console.error('Address search failed', err); }
  };

  useEffect(() => {
    if (isEditMode) fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await eventService.getOne(id!);
      const event = res.data;
      const format = (d: string) => d ? new Date(d).toISOString().slice(0, 16) : '';
      setFormData({
        ...event,
        startDate: format(event.startDate),
        endDate: format(event.endDate),
        ticketTypes: event.ticketTypes?.length > 0 ? event.ticketTypes : formData.ticketTypes,
        customFields: event.customFields || [],
        coHostIds: event.coHosts?.map((c: any) => c.id) || []
      });
      setAddressSearch(event.location || '');
    } catch (err) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  };

  const handleAiGenerate = async () => {
    if (!aiUrl) return;
    try {
      setLoading(true);
      const res = await eventService.autoGenerate(aiUrl);
      const data = res.data;
      setFormData({
        ...formData,
        title: data.title || formData.title,
        description: data.description || formData.description,
        location: data.location || formData.location,
        image: data.image || formData.image,
        ticketTypes: data.ticketTypes?.length > 0 ? data.ticketTypes : formData.ticketTypes
      });
      toast.success('Généré par l\'IA !');
    } catch (err) { toast.error('Erreur IA'); } finally { setLoading(false); }
  };

  const addTicketType = () => {
    setFormData({ ...formData, ticketTypes: [...formData.ticketTypes, { name: 'Tier', price: 0, totalQuantity: 50, order: formData.ticketTypes.length, isHidden: false, points: 10, description: '', salesStartDate: '', salesEndDate: '' }] });
  };

  const removeTicketType = (index: number) => {
    const newTiers = [...formData.ticketTypes];
    newTiers.splice(index, 1);
    setFormData({ ...formData, ticketTypes: newTiers });
  };

  const addCustomField = () => {
    setFormData({ ...formData, customFields: [...formData.customFields, { label: 'Question', type: 'text', isRequired: false, options: [] }] });
  };

  const removeCustomField = (index: number) => {
    const newFields = [...formData.customFields];
    newFields.splice(index, 1);
    setFormData({ ...formData, customFields: newFields });
  };

  const handleSubmit = async () => {
    if (!formData.communityId || !formData.title || !formData.startDate) {
      return toast.error('Infos manquantes (Titre, Communauté, Date)');
    }
    try {
      setSubmitting(true);

      // Clean up ticket types to send null for empty dates
      const cleanedData = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        ticketTypes: formData.ticketTypes.map(tier => ({
          ...tier,
          salesStartDate: tier.salesStartDate || null,
          salesEndDate: tier.salesEndDate || null
        }))
      };

      if (isEditMode) await eventService.update(id!, cleanedData);
      else await eventService.create(cleanedData);

      toast.success('Publié !');
      navigate('/events');
    } catch (err: any) {
      console.error('Submit failed', err);
      toast.error('Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-primary opacity-40" /></div>;

  const steps = [
    { id: 'general', label: 'Infos', icon: Sparkles },
    { id: 'tickets', label: 'Billets', icon: Ticket },
    { id: 'form', label: 'Formulaire', icon: HelpCircle },
    { id: 'visibility', label: 'Publier', icon: Eye }
  ];
  const currentStepIndex = steps.findIndex(s => s.id === tab);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Modifier' : 'Créer'} un événement</h2>
        <p className="text-xs text-muted-foreground font-medium">Configurez votre expérience.</p>
      </div>

      {!isEditMode && (
        <Card className="border border-primary/20 bg-primary/[0.02] rounded-xl overflow-hidden shadow-sm">
          <CardContent className="p-4 flex gap-3 items-center">
            <div className="p-2 rounded-lg bg-primary text-white shrink-0"><Sparkles size={16} /></div>
            <Input placeholder="Lien IA Magic (Shotgun, Instagram...)" className="h-9 text-xs" value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} />
            <Button onClick={handleAiGenerate} size="sm" className="h-9 px-4 font-bold text-[10px] uppercase tracking-wider">Générer</Button>
          </CardContent>
        </Card>
      )}

      {/* Stepper */}
      <div className="relative mb-8 px-6">
        <div className="absolute top-[18px] left-[42px] right-[42px] h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isActive = tab === step.id;
            const isPast = currentStepIndex > index;
            return (
              <button key={step.id} onClick={() => setTab(step.id)} className="flex flex-col items-center gap-2 group">
                <div className={cn("relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all", isActive ? "bg-white border-primary shadow-sm scale-110" : isPast ? "bg-primary border-primary text-white" : "bg-white border-gray-100 text-gray-300")}>
                  <step.icon size={16} className={cn(isActive && "text-primary")} />
                </div>
                <span className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-gray-400")}>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsContent value="general">
          <Card className="border-none shadow-sm rounded-2xl bg-white border border-gray-50">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold">Informations de Base</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Communauté</Label>
                  <Select value={formData.communityId} onValueChange={(val: string | null) => setFormData({ ...formData, communityId: val || '' })}>
                    <SelectTrigger className="h-9 text-xs">
                      {communities.find(c => c.id === formData.communityId)?.name || "Choisir..."}
                    </SelectTrigger>
                    <SelectContent>{communities.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Titre</Label>
                  <Input placeholder="Nom de l'événement" className="h-9 text-xs font-bold" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Début</Label>
                  <Input type="datetime-local" className="h-9 text-xs" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Fin</Label>
                  <Input type="datetime-local" className="h-9 text-xs" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5 relative">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Lieu</Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <Input
                    placeholder="Rechercher une adresse réelle..."
                    className="h-9 pl-9 text-xs"
                    value={addressSearch || formData.location}
                    onChange={(e) => {
                      setAddressSearch(e.target.value);
                      if (!e.target.value) setFormData({ ...formData, location: '', latitude: null, longitude: null });
                    }}
                  />
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {addressSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-medium hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none flex items-start gap-3"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            location: suggestion.display_name,
                            latitude: parseFloat(suggestion.lat),
                            longitude: parseFloat(suggestion.lon)
                          });
                          setAddressSearch(suggestion.display_name);
                          setAddressSuggestions([]);
                          toast.success('Adresse géolocalisée !', { duration: 1500 });
                        }}
                      >
                        <MapPin size={12} className="mt-0.5 text-primary shrink-0" />
                        <span className="truncate">{suggestion.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Description</Label>
                <textarea className="w-full min-h-[80px] rounded-lg border border-gray-100 bg-gray-50/30 px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-primary/20 outline-none resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Image de l'événement</Label>
                  <div className="flex gap-4 items-start">
                    {formData.image ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden group">
                        <img src={formData.image} className="w-full h-full object-cover" />
                        <button onClick={() => setFormData({ ...formData, image: '' })} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/20 hover:bg-primary/[0.02] transition-all group">
                        <ImageIcon size={20} className="text-gray-300 group-hover:text-primary/40 transition-colors" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-2">Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const res = await storageService.upload(file);
                              setFormData({ ...formData, image: res.data.url });
                              toast.success('Image ajoutée');
                            } catch (err) { toast.error('Erreur upload'); }
                          }
                        }} />
                      </label>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Tags</Label>
                      <Input
                        placeholder="Sport, Musique, Networking... (séparés par des virgules)"
                        className="h-8 text-[10px]"
                        value={formData.tags.join(', ')}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Co-organisateurs</Label>
                  <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/30 min-h-[96px] space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {formData.coHostIds.length > 0 ? (
                        formData.coHostIds.map(id => (
                          <Badge key={id} variant="secondary" className="bg-white border-gray-100 text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 group">
                            {id.slice(0, 8)}...
                            <X size={10} className="cursor-pointer hover:text-destructive" onClick={() => setFormData({ ...formData, coHostIds: formData.coHostIds.filter(cid => cid !== id) })} />
                          </Badge>
                        ))
                      ) : (
                        <p className="text-[10px] text-muted-foreground opacity-60 italic">Aucun co-organisateur sélectionné</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2"><Button onClick={() => setTab('tickets')} size="sm" className="h-9 px-8 font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/5">Suivant</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white border border-gray-50">
            <CardHeader className="p-5 pb-0 flex justify-between items-center flex-row">
              <CardTitle className="text-sm font-bold">Billetterie</CardTitle>
              <Button variant="outline" size="sm" onClick={addTicketType} className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider"><Plus size={12} className="mr-1" /> Ajouter un tier</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="grid grid-cols-12 gap-3 px-3 mb-1">
                <div className="col-span-5 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Nom du billet</div>
                <div className="col-span-3 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Prix (€)</div>
                <div className="col-span-3 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Quantité</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {formData.ticketTypes.map((tier, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50/40 border border-gray-100/50 space-y-3 transition-all hover:bg-gray-50/80">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <Input className="h-8 text-xs font-bold bg-white" placeholder="ex: Regular" value={tier.name} onChange={(e) => { const n = [...formData.ticketTypes]; n[idx].name = e.target.value; setFormData({ ...formData, ticketTypes: n }); }} />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          className="h-8 text-xs font-bold bg-white" 
                          placeholder="0" 
                          value={formData.isOnline ? 0 : tier.price} 
                          disabled={formData.isOnline}
                          onChange={(e) => { 
                            const n = [...formData.ticketTypes]; 
                            n[idx].price = formData.isOnline ? 0 : Number(e.target.value); 
                            setFormData({ ...formData, ticketTypes: n }); 
                          }} 
                        />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" className="h-8 text-xs font-bold bg-white" placeholder="100" value={tier.totalQuantity} onChange={(e) => { const n = [...formData.ticketTypes]; n[idx].totalQuantity = Number(e.target.value); setFormData({ ...formData, ticketTypes: n }); }} />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeTicketType(idx)} className="h-7 w-7 text-destructive hover:bg-destructive/5"><Trash2 size={14} /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Description (optionnel)</Label>
                        <Input className="h-7 text-[10px] bg-white/50 border-gray-100" placeholder="Ce qui est inclus..." value={tier.description || ''} onChange={(e) => { const n = [...formData.ticketTypes]; n[idx].description = e.target.value; setFormData({ ...formData, ticketTypes: n }); }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Début des ventes</Label>
                        <Input type="datetime-local" className="h-7 text-[9px] bg-white/50 border-gray-100" value={tier.salesStartDate || ''} onChange={(e) => { const n = [...formData.ticketTypes]; n[idx].salesStartDate = e.target.value; setFormData({ ...formData, ticketTypes: n }); }} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Fin des ventes</Label>
                        <Input type="datetime-local" className="h-7 text-[9px] bg-white/50 border-gray-100" value={tier.salesEndDate || ''} onChange={(e) => { const n = [...formData.ticketTypes]; n[idx].salesEndDate = e.target.value; setFormData({ ...formData, ticketTypes: n }); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setTab('general')} className="h-9 text-[10px] uppercase font-bold tracking-wider">Retour</Button>
                <Button onClick={() => setTab('form')} size="sm" className="h-9 px-8 font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/5">Suivant</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white border border-gray-50">
            <CardHeader className="p-5 pb-2 flex justify-between items-center flex-row">
              <CardTitle className="text-sm font-bold">Questionnaire de vente</CardTitle>
              <Button variant="outline" size="sm" onClick={addCustomField} className="h-7 px-3 text-[9px] font-bold uppercase"><Plus size={12} className="mr-1" /> Ajouter</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-4">
              <div className="grid grid-cols-12 gap-3 px-1 mb-1">
                <div className="col-span-11 text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Question</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-2">
                {formData.customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input className="h-9 text-xs font-medium bg-gray-50/50 border-gray-100" placeholder="ex: Quelle est votre pointure ?" value={field.label} onChange={(e) => { const n = [...formData.customFields]; n[idx].label = e.target.value; setFormData({ ...formData, customFields: n }); }} />
                    <Button variant="ghost" size="icon" onClick={() => removeCustomField(idx)} className="h-9 w-9 text-destructive hover:bg-destructive/5"><Trash2 size={14} /></Button>
                  </div>
                ))}
                {formData.customFields.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground opacity-60">Aucune question personnalisée</p>
                  </div>
                )}
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-xl border-2 transition-all", formData.isRecurring ? "border-primary bg-primary/[0.02]" : "border-gray-50 bg-gray-50/30")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest">Récurrence</span>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                      className={cn("text-[8px] font-black uppercase px-2.5 py-1 rounded-lg transition-all", formData.isRecurring ? "bg-primary text-white shadow-sm" : "bg-gray-200 text-gray-500")}
                    >
                      {formData.isRecurring ? 'Activé' : 'Désactivé'}
                    </button>
                  </div>
                  {formData.isRecurring && (
                    <Select value={formData.recurrenceRule || undefined} onValueChange={(val) => setFormData({ ...formData, recurrenceRule: val || '' })}>
                      <SelectTrigger className="h-8 text-[10px] bg-white border-primary/20">
                        <SelectValue placeholder="Choisir la fréquence..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily" className="text-[10px]">Chaque jour</SelectItem>
                        <SelectItem value="weekly" className="text-[10px]">Chaque semaine</SelectItem>
                        <SelectItem value="monthly" className="text-[10px]">Chaque mois</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className={cn("p-4 rounded-xl border-2 transition-all", formData.isOnline ? "border-primary bg-primary/[0.02]" : "border-gray-50 bg-gray-50/30")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest">En Ligne</span>
                    </div>
                    <button
                      onClick={() => {
                        const newIsOnline = !formData.isOnline;
                        const updatedTicketTypes = newIsOnline
                          ? formData.ticketTypes.map(t => ({ ...t, price: 0 }))
                          : formData.ticketTypes;
                        setFormData({ 
                          ...formData, 
                          isOnline: newIsOnline,
                          ticketTypes: updatedTicketTypes
                        });
                      }}
                      className={cn("text-[8px] font-black uppercase px-2.5 py-1 rounded-lg transition-all", formData.isOnline ? "bg-primary text-white shadow-sm" : "bg-gray-200 text-gray-500")}
                    >
                      {formData.isOnline ? 'Activé' : 'Désactivé'}
                    </button>
                  </div>
                  {formData.isOnline && (
                    <Input
                      placeholder="Lien de la réunion (Zoom, Meet...)"
                      className="h-8 text-[10px] bg-white border-primary/20"
                      value={formData.meetingLink || ''}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between pt-4"><Button variant="ghost" onClick={() => setTab('tickets')} className="h-9 text-[10px] uppercase font-bold">Retour</Button><Button onClick={() => setTab('visibility')} size="sm" className="h-9 px-6 font-bold text-[10px] uppercase">Suivant</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card className="border-none shadow-sm rounded-2xl bg-white border border-gray-50">
            <CardHeader className="p-5 pb-2"><CardTitle className="text-sm font-bold">Publication</CardTitle></CardHeader>
            <CardContent className="p-5 pt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setFormData({ ...formData, visibility: 'public' })} className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all", formData.visibility === 'public' ? "border-primary bg-primary/5 shadow-sm" : "border-gray-50 bg-gray-50/30 hover:border-gray-200")}>
                  <Globe size={20} className={cn("mb-2", formData.visibility === 'public' ? "text-primary" : "text-gray-300")} />
                  <h4 className="text-xs font-bold">Public</h4>
                </div>
                <div onClick={() => setFormData({ ...formData, visibility: 'community_only' })} className={cn("p-4 rounded-xl border-2 cursor-pointer transition-all", formData.visibility === 'community_only' ? "border-primary bg-primary/5 shadow-sm" : "border-gray-50 bg-gray-50/30 hover:border-gray-200")}>
                  <Lock size={20} className={cn("mb-2", formData.visibility === 'community_only' ? "text-primary" : "text-gray-300")} />
                  <h4 className="text-xs font-bold">Privé</h4>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4"><Button variant="ghost" onClick={() => setTab('form')} className="h-9 text-[10px] uppercase font-bold">Retour</Button><Button onClick={handleSubmit} disabled={submitting} size="sm" className="h-10 px-8 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20">{submitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Publier'}</Button></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEvent;
