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
  return (
    <Card className={cn("shadow-klyb-sm border-border/60 transition-shadow hover:shadow-klyb", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
            {change && change !== "-" && (
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
