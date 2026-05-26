import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { APP_NAME } from '../constants/app';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const { accessToken, refreshToken, user: userData } = res.data.data;
      login(accessToken, userData, refreshToken);
      toast.success('Bon retour parmi nous !');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-[2rem] shadow-2xl shadow-primary/40 mb-6" />
          <h1 className="text-4xl font-black tracking-tighter mb-2">{APP_NAME} Admin</h1>
          <p className="text-muted-foreground font-medium text-center">Gérez vos communautés avec élégance.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black tracking-tight">Connexion</CardTitle>
            <CardDescription className="text-base font-medium">Entrez vos accès organisateur pour continuer.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Professionnel</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.5} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="organisateur@clubz.app" 
                    className="pl-12 h-14 bg-muted/30 border-2 border-transparent focus-visible:border-primary/30 rounded-2xl text-base font-bold transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Oublié ?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" strokeWidth={2.5} />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••••••" 
                    className="pl-12 h-14 bg-muted/30 border-2 border-transparent focus-visible:border-primary/30 rounded-2xl text-base font-bold transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-16 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all mt-4">
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <>Accéder au Panel <Sparkles size={20} strokeWidth={2.5} /></>}
              </Button>
            </form>
            
            <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
              Pas encore de communauté ? <button className="text-primary font-black uppercase tracking-tighter hover:underline">Créer un compte</button>
            </p>
          </CardContent>
          <div className="h-2 w-full bg-primary/20" />
        </Card>
      </div>
    </div>
  );
};

export default Login;
