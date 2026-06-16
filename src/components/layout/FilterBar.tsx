import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
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
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-2",
        className
      )}
    >
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {trailing}
    </div>
  )
}
