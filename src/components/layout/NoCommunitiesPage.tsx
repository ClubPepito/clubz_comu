import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { APP_NAME, APP_DOMAIN } from "@/constants/app"

interface NoCommunitiesPageProps {
  onRefresh?: () => void
  onLogout: () => void
}

export function NoCommunitiesPage({ onRefresh, onLogout }: NoCommunitiesPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="size-9 rounded-xl shadow-klyb-sm" />
          <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <Button variant="ghost" onClick={onLogout} className="text-muted-foreground">
          Déconnexion
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        <Empty className="max-w-md border-border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="text-lg">Aucune communauté</EmptyTitle>
            <EmptyDescription>
              Vous n&apos;avez accès à aucune communauté pour le moment. Créez-en une ou
              rejoignez-en une depuis l&apos;application {APP_NAME} pour accéder à
              l&apos;espace admin.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="gap-3">
            <Button
              onClick={() => window.open(`https://${APP_DOMAIN}`, "_blank", "noopener,noreferrer")}
            >
              Ouvrir {APP_NAME}
            </Button>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Actualiser
              </Button>
            )}
          </EmptyContent>
        </Empty>
      </main>
    </div>
  )
}
