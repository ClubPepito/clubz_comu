import { cn } from "@/lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex flex-col gap-8 pb-12", className)}>
      {children}
    </div>
  )
}
