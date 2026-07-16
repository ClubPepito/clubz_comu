import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change?: string
  trend?: "up" | "down"
  icon: LucideIcon
  loading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  trend = "up",
  icon: Icon,
  loading,
  className,
}: StatCardProps) {
  const showChange = Boolean(change && change !== "-")

  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-2xl border-border/80 shadow-klyb-sm transition-shadow hover:shadow-klyb",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {loading ? (
          <>
            <Skeleton className="h-8 w-24" />
            <div className="h-5" aria-hidden />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
            <div className="min-h-5">
              {showChange ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    "w-fit text-xs font-medium",
                    trend === "up"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {change}
                </Badge>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
