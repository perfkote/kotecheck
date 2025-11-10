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
    <Card className={cn("p-6 hover-elevate transition-all", className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <div className={cn("text-4xl font-bold", valueClassName)} data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
          {value}
        </div>
        {trend && (
          <div className="text-sm text-muted-foreground">{trend}</div>
        )}
      </div>
    </Card>
  );
}
