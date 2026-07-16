import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"

interface AtmosphericHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  children?: React.ReactNode
  className?: string
  /** Softer teal-first gradient (developer space) vs secondary-first (marketplace) */
  tone?: "default" | "accent"
}

export function AtmosphericHeader({
  title,
  description,
  actions,
  meta,
  children,
  className,
  tone = "default",
}: AtmosphericHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 px-6 py-7 shadow-klyb-sm sm:px-8",
        tone === "accent"
          ? "bg-gradient-to-br from-accent/70 via-card to-secondary/50"
          : "bg-gradient-to-br from-secondary/80 via-card to-accent/40",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-tertiary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6">
        <PageHeader title={title} description={description} actions={actions} />
        {meta}
        {children}
      </div>
    </div>
  )
}
