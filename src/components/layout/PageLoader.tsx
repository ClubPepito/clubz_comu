import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  label?: string
  className?: string
}

export function PageLoader({ label = "Chargement…", className }: PageLoaderProps) {
  return (
    <div className={cn("flex min-h-[50vh] flex-col items-center justify-center gap-3", className)}>
      <Spinner className="size-8 text-primary" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}
