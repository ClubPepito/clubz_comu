import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout, Loader2, CheckCircle2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { authService } from '../services/api';

export default function CliAuth() {
    const [searchParams] = useSearchParams();
    const callbackUrl = searchParams.get('callback');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!callbackUrl) {
            setError('Callback URL manquante. Relancez "clubz login".');
            return;
        }

        setIsLoading(true);

        try {
            const res = await authService.login({ email, password });
            const accessToken = res.data?.data?.accessToken || res.data?.data?.token;

            if (!accessToken) {
                throw new Error('Token manquant dans la réponse API');
            }

            setSuccess(true);
            window.location.href = `${callbackUrl}?token=${encodeURIComponent(accessToken)}`;

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    if (!callbackUrl) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
                <Terminal className="w-12 h-12 text-red-400 mb-4" />
                <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
                <p className="text-slate-400">Cette page doit être ouverte via <code className="bg-slate-800 px-2 py-1 rounded">clubz login</code></p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-white">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Connecté !</h1>
                <p className="text-slate-400">Vous pouvez fermer cette fenêtre et retourner dans le terminal.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
            <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4 justify-center">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-xl shadow-cyan-500/30">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
                        <Layout className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Clubz CLI</h1>
                <p className="text-slate-400 font-medium">Authentification pour la ligne de commande</p>
            </div>

            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 bg-slate-900 border-slate-800">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center text-white">Connexion</CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Connectez-vous avec votre compte Clubz
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white" type="submit" disabled={isLoading}>
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Autoriser la CLI
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-4 text-xs text-slate-600">
                Le token sera envoyé à votre terminal local uniquement.
            </p>
        </div>
    );
}
