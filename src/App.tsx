import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  Users,
  BarChart3,
  LogOut,
  Loader2,
  Settings,
  ShieldAlert,
  Store,
  Layers,
  Code2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import Events from './pages/Events';
import Members from './pages/Members';
import Analytics from './pages/Analytics';
import CommunitySettings from './pages/CommunitySettings';
import Moderation from './pages/Moderation';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';
import PageBuilderPage from './pages/PageBuilder';
import Developer from './pages/Developer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommunityProvider, useCommunity } from './context/CommunityContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from '@/constants/app';

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
  >
    <Icon size={20} strokeWidth={2.5} />
    <span className="text-sm font-semibold tracking-tight">{label}</span>
  </Link>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { communities, selectedCommunityId, setSelectedCommunityId, loading } = useCommunity();

  // Don't show layout on login page
  if (location.pathname === '/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col p-6 sticky top-0 h-screen shadow-sm z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-primary/30" />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none tracking-tight">{APP_NAME}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Admin Panel</span>
          </div>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2 block">Communauté</label>
          <Select value={selectedCommunityId || 'all'} onValueChange={(val) => setSelectedCommunityId(val === 'all' ? null : val)}>
            <SelectTrigger size="sm" className="pl-8 relative text-left">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-primary absolute left-2.5 top-1/2 -translate-y-1/2" />}
              <span className="truncate">
                {selectedCommunityId
                  ? (communities.find(c => c.id === selectedCommunityId)?.name || "Chargement...")
                  : "Toutes"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {communities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarLink to="/create" icon={PlusCircle} label="Créer un Event" active={location.pathname === '/create'} />
          <SidebarLink to="/events" icon={Calendar} label="Mes Événements" active={location.pathname.startsWith('/events')} />
          <SidebarLink to="/members" icon={Users} label="Membres" active={location.pathname === '/members'} />
          <SidebarLink to="/analytics" icon={BarChart3} label="Statistiques" active={location.pathname === '/analytics'} />
          <SidebarLink to="/moderation" icon={ShieldAlert} label="Modération" active={location.pathname === '/moderation'} />
          <SidebarLink to="/settings" icon={Settings} label="Paramètres" active={location.pathname === '/settings'} />

          <div className="my-2 border-t border-border/50" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-1">Communauté</p>
          <SidebarLink to="/marketplace" icon={Store} label="Marketplace" active={location.pathname === '/marketplace'} />
          <SidebarLink to="/page-builder" icon={Layers} label="Page Builder" active={location.pathname === '/page-builder'} />
          <SidebarLink to="/developer" icon={Code2} label="Espace Développeur" active={location.pathname === '/developer'} />
        </nav>

        <div className="mt-auto">
          <Separator className="my-6 opacity-50" />
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-3 px-3 py-6 rounded-xl transition-colors"
          >
            <LogOut size={20} strokeWidth={2.5} />
            <span className="font-semibold">Déconnexion</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-muted/20">
        {/* Navbar */}
        <header className="h-20 border-b bg-card/80 backdrop-blur-md px-8 flex items-center justify-end sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold group-hover:text-primary transition-colors">{user?.name || 'Utilisateur'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Organisateur Certifié</p>
            </div>
            <Avatar className="h-11 w-11 border-2 border-primary/10 group-hover:border-primary/30 transition-all shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CommunityProvider>
          <Toaster />
          <AppLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/create/:id" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/moderation" element={<ProtectedRoute><Moderation /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><CommunitySettings /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/page-builder" element={<ProtectedRoute><PageBuilderPage /></ProtectedRoute>} />
              <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </CommunityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
