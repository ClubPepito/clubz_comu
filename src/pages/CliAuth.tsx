import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Terminal, CheckCircle2, AlertCircle } from "lucide-react"
import { BRAND_NAME } from "@/constants/branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { authService } from "@/services/api"

export default function CliAuth() {
  const [searchParams] = useSearchParams()
  const callbackUrl = searchParams.get("callback")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (!callbackUrl) {
      setError(`Callback URL manquante. Relancez "${BRAND_NAME.toLowerCase()} login".`)
      return
    }

    setIsLoading(true)

    try {
      const res = await authService.login({ email, password })
      const accessToken = res.data?.data?.accessToken || res.data?.data?.token

      if (!accessToken) {
        throw new Error("Token manquant dans la réponse API")
      }

      setSuccess(true)
      window.location.href = `${callbackUrl}?token=${encodeURIComponent(accessToken)}`
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (!callbackUrl) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6">
        <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full bg-destructive/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] size-[40%] rounded-full bg-destructive/5 blur-[120px]" />

        <Card className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 shadow-klyb">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Terminal className="size-7" />
            </div>
            <h1 className="mb-2 text-xl font-bold">Lien invalide</h1>
            <p className="text-sm text-muted-foreground">
              Cette page doit être ouverte via{" "}
              <code className="rounded-lg bg-muted px-2 py-1 text-sm">{BRAND_NAME.toLowerCase()} login</code>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6">
        <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full bg-success/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] size-[40%] rounded-full bg-success/5 blur-[120px]" />

        <Card className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 shadow-klyb">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-9" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Connecté !</h1>
            <p className="text-sm text-muted-foreground">
              Vous pouvez fermer cette fenêtre et retourner dans le terminal.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6">
      <div className="absolute top-[-10%] left-[-10%] size-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute right-[-10%] bottom-[-10%] size-[40%] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-klyb">
              <Terminal className="text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{BRAND_NAME} CLI</h1>
          <p className="font-medium text-muted-foreground">
            Authentification pour la ligne de commande
          </p>
        </div>

        <Card className="rounded-2xl border border-border/60 shadow-klyb">
          <CardHeader>
            <CardTitle className="text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous avec votre compte {BRAND_NAME}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  className="h-11 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-11 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Spinner />}
                Autoriser la CLI
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Le token sera envoyé à votre terminal local uniquement.
        </p>
      </div>
    </div>
  )
}
