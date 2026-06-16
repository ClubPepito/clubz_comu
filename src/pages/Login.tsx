import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Mail, Lock, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { APP_NAME } from "@/constants/app"
import { BRAND_DOMAIN } from "@/constants/branding"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      const { accessToken, token, refreshToken, user: userData } = res.data.data
      login(accessToken || token, userData, refreshToken)
      toast.success("Bon retour parmi nous !")
      navigate("/")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Identifiants invalides")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      await authService.forgotPassword({ email: forgotEmail })
      toast.success("Si l'adresse existe, un lien a été envoyé par e-mail.")
      setShowForgotModal(false)
      setForgotEmail("")
    } catch {
      toast.error("Une erreur est survenue.")
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute right-[-10%] bottom-[-10%] size-[40%] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="mb-6 size-16 rounded-2xl shadow-klyb"
          />
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{APP_NAME} Admin</h1>
          <p className="text-center text-muted-foreground">
            Gérez vos communautés avec élégance.
          </p>
        </div>

        <Card className="overflow-hidden border-border/60 shadow-klyb">
          <CardHeader className="gap-1">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>Entrez vos accès organisateur pour continuer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={`organisateur@${BRAND_DOMAIN}`}
                    className="h-11 pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    className="h-11 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    Accéder au panel
                    <Sparkles data-icon="inline-end" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Pas encore de communauté ?{" "}
              <Link to="https://app.klyb.app" target="_blank" className="font-semibold text-primary hover:underline">
                Créer un compte sur app.klyb.app
              </Link>
            </p>
          </CardContent>
        </Card>

        <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mot de passe oublié ?</DialogTitle>
              <DialogDescription>
                Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="nom@exemple.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading && <Spinner />}
                  Envoyer le lien
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Login
