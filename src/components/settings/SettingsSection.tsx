import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function SettingsSection({ title, description, children, footer, className }: SettingsSectionProps) {
  return (
    <Card className={cn("overflow-hidden border-border/80 shadow-klyb-sm", className)}>
      <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-6">{children}</CardContent>
      {footer && (
        <CardFooter className="border-t border-border/60 bg-muted/20">{footer}</CardFooter>
      )}
    </Card>
  )
}

interface SettingsFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function SettingsField({ label, hint, children, className }: SettingsFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
