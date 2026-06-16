import type { LucideIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const pageTabsListClass =
  "mb-6 h-11 w-fit gap-1 rounded-xl border border-border bg-muted/50 p-1 shadow-klyb-sm"

const pageTabsTriggerClass = "h-9 rounded-lg px-4"

type PageTabsProps = React.ComponentProps<typeof Tabs>

export function PageTabs({ className, ...props }: PageTabsProps) {
  return <Tabs className={cn("w-full", className)} {...props} />
}

const gridColsClass: Record<number, string> = {
  2: "grid w-full grid-cols-2",
  3: "grid w-full grid-cols-3",
  4: "grid w-full grid-cols-4",
  5: "grid w-full grid-cols-5",
  6: "grid w-full grid-cols-6",
}

interface PageTabsListProps extends React.ComponentProps<typeof TabsList> {
  fullWidth?: boolean
  columns?: 2 | 3 | 4 | 5 | 6
}

export function PageTabsList({ className, fullWidth, columns, ...props }: PageTabsListProps) {
  return (
    <TabsList
      className={cn(
        pageTabsListClass,
        fullWidth && "w-full",
        columns && gridColsClass[columns],
        className
      )}
      {...props}
    />
  )
}

interface PageTabsTriggerProps extends React.ComponentProps<typeof TabsTrigger> {
  icon?: LucideIcon
  tone?: "default" | "destructive"
}

export function PageTabsTrigger({
  className,
  icon: Icon,
  tone = "default",
  children,
  ...props
}: PageTabsTriggerProps) {
  return (
    <TabsTrigger
      className={cn(
        pageTabsTriggerClass,
        tone === "destructive" && "data-active:text-destructive",
        className
      )}
      {...props}
    >
      {Icon && <Icon data-icon="inline-start" />}
      {children}
    </TabsTrigger>
  )
}

export function PageTabsContent({ className, ...props }: React.ComponentProps<typeof TabsContent>) {
  return <TabsContent className={cn("mt-0 outline-none", className)} {...props} />
}
