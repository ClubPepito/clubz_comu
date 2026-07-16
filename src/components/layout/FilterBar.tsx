import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterBarProps {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  trailing?: React.ReactNode
  className?: string
}

export function FilterBar({ options, value, onChange, trailing, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/40 p-1",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const active = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant={active ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onChange(option.value)}
              className={cn("h-8 gap-1.5 rounded-lg text-xs font-medium", active && "shadow-sm")}
            >
              {option.label}
              {typeof option.count === "number" && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-background/80 text-muted-foreground",
                  )}
                >
                  {option.count}
                </span>
              )}
            </Button>
          )
        })}
      </div>
      {trailing}
    </div>
  )
}
