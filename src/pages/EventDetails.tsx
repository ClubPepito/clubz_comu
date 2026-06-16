import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search,
  QrCode,
  MoreVertical,
  Filter,
  CheckCircle2,
  MapPin,
  Calendar as CalendarIcon,
  Loader2,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/PageShell";
import { PageTabs, PageTabsList, PageTabsTrigger, PageTabsContent } from "@/components/layout/PageTabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { eventService } from '../services/api';
import { toast } from 'sonner';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('analytics');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [eventRes, analyticsRes, attendeesRes] = await Promise.all([
          eventService.getOne(id),
          eventService.getStats(id).catch(() => ({ data: null })),
          eventService.getAttendees(id).catch(() => ({ data: [] }))
        ]);
        setEvent(eventRes.data);
        setAnalytics(analyticsRes.data);
        setAttendees(attendeesRes.data || []);
      } catch (err) { toast.error('Erreur chargement'); } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleCheckIn = async (ticketId: string) => {
    if (!id) return;
    setCheckingIn(ticketId);
    try {
      await eventService.checkIn(id, ticketId);
      toast.success('Check-in réussi !');
      setAttendees(attendees.map(a => a.id === ticketId ? { ...a, checkedIn: true } : a));
    } catch (err: any) { toast.error('Erreur check-in'); } finally { setCheckingIn(null); }
  };

  const handleExportCalendar = async () => {
    if (!id) return;
    try {
      const res = await eventService.getCalendar(id);
      const blob = new Blob([res.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title}.ics`);
      document.body.appendChild(link);
      link.click();
      toast.success('Exporté !');
    } catch (err) { toast.error('Erreur export'); }
  };

  const handleDeleteEvent = async () => {
    if (!id || !confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    try {
      await eventService.delete(id);
      toast.success('Supprimé');
      navigate('/events');
    } catch (err) { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-primary opacity-40" /></div>;
  if (!event) return <div className="text-center py-20"><h2 className="text-lg font-bold">Introuvable</h2><Link to="/" className="text-primary text-xs font-bold mt-2 inline-block">Retour</Link></div>;

  return (
    <PageShell>
      <Link to="/events" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all uppercase tracking-wider">
        <ArrowLeft size={14} /> Retour
      </Link>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 rounded-2xl border border-border shadow-sm">
              <AvatarImage src={event.image} className="object-cover" />
              <AvatarFallback>EV</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 bg-success rounded-lg border-2 border-white flex items-center justify-center shadow-sm">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
              <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest bg-success/5 text-success border-success/10 px-1.5 py-0">PUBLIÉ</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-tight opacity-70">
              <span className="flex items-center gap-1.5"><CalendarIcon size={12} className="text-primary" /> {new Date(event.startDate).toLocaleDateString()}</span>
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {event.location}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Link to={`/create/${event.id}`}>
            <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-border bg-card font-bold gap-2 text-[10px] uppercase tracking-wider"><Pencil size={14} /> Éditer</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExportCalendar} className="h-9 px-3 rounded-xl border-border bg-card font-bold gap-2 text-[10px] uppercase tracking-wider"><CalendarIcon size={14} /> iCal</Button>
          <Button onClick={handleDeleteEvent} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/5"><Trash2 size={14} /></Button>
          <Button size="sm" className="h-9 px-4 rounded-xl font-bold gap-2 shadow-md shadow-primary/10 text-[10px] uppercase tracking-wider"><QrCode size={14} /> Scanner</Button>
        </div>
      </div>

      <PageTabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <PageTabsList>
          <PageTabsTrigger value="analytics">Analytics</PageTabsTrigger>
          <PageTabsTrigger value="attendees">Invités ({attendees.length})</PageTabsTrigger>
          <PageTabsTrigger value="gamification">Gamification</PageTabsTrigger>
        </PageTabsList>

        <PageTabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-none shadow-sm bg-card rounded-xl border border-border">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Revenu</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-black tracking-tighter">{analytics?.totalRevenue?.toLocaleString() || '0'} €</div>
                <Badge variant="outline" className="mt-2 bg-success/5 text-success border-success/10 text-[8px] font-bold">+24%</Badge>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card rounded-xl border border-border">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Check-ins</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-black tracking-tighter">{analytics?.checkInCount || 0} <span className="text-xs text-muted-foreground font-medium">/ {event.capacity || 0}</span></div>
                <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, ((analytics?.checkInCount || 0) / (event.capacity || 1)) * 100)}%` }} /></div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card rounded-xl border border-border">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Waitlist</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-black tracking-tighter text-warning">{analytics?.waitlistCount || 0}</div>
                <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tight opacity-50 italic">Demande forte</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-2xl bg-card border border-border">
            <CardHeader className="p-5 pb-2"><CardTitle className="text-sm font-bold">Ventes Live</CardTitle></CardHeader>
            <CardContent className="p-5 pt-0 h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.salesHistory || []}>
                  <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--color-muted-foreground)', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--color-muted-foreground)', fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', background: 'var(--color-card)', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="sales" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </PageTabsContent>

        <PageTabsContent value="attendees">
          <Card className="border-none shadow-sm rounded-2xl bg-card border border-border overflow-hidden">
            <CardHeader className="p-5 pb-4 flex flex-row items-center justify-between gap-4">
            <div className="relative w-48 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9" />
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-lg border-border font-bold gap-2 text-[10px] uppercase tracking-wider"><Filter size={14} /> Filtre</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="px-5 h-10 text-[9px] font-black uppercase tracking-widest opacity-50">Participant</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest opacity-50">Billet</TableHead>
                    <TableHead className="h-10 text-[9px] font-black uppercase tracking-widest opacity-50 text-center">Check-in</TableHead>
                    <TableHead className="px-5 h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map((a) => (
                    <TableRow key={a.id} className="group hover:bg-muted/50 transition-colors border-border">
                      <TableCell className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg border border-border shadow-sm shrink-0">
                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">{(a.user?.name || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0"><p className="text-[12px] font-bold leading-tight truncate">{a.user?.name || 'Utilisateur'}</p><p className="text-[9px] text-muted-foreground opacity-60 truncate">{a.user?.email}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="rounded-md bg-muted text-foreground border-border font-bold uppercase text-[8px] px-1.5 py-0">{a.ticketType?.name || 'Standard'}</Badge></TableCell>
                      <TableCell className="text-center">
                        {a.checkedIn ? <CheckCircle2 size={18} className="text-success mx-auto" /> : <Button variant="ghost" size="icon" disabled={checkingIn === a.id} onClick={() => handleCheckIn(a.id)} className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all">{checkingIn === a.id ? <Loader2 className="animate-spin h-3 w-3" /> : <QrCode size={14} />}</Button>}
                      </TableCell>
                      <TableCell className="text-right px-5"><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><MoreVertical size={14} /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageTabsContent>
      </PageTabs>
    </PageShell>
  );
};

export default EventDetails;
