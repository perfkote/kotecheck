import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  valueClassName?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className, valueClassName }: StatsCardProps) {
  return (
    <Card className={cn("p-3 sm:p-4 hover-elevate transition-all", className)}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
          <Icon className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <div className={cn("text-xl sm:text-2xl md:text-3xl font-bold", valueClassName)} data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
          {value}
        </div>
        {trend && (
          <div className="text-xs text-muted-foreground">{trend}</div>
        )}
      </div>
    </Card>
  );
}
