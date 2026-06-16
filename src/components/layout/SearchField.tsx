import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchFieldProps extends React.ComponentProps<typeof Input> {
  containerClassName?: string
}

export function SearchField({ containerClassName, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn("relative w-full sm:w-64", containerClassName)}>
      <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  )
}
