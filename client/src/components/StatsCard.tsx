import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <div className="text-4xl font-bold" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
          {value}
        </div>
        {trend && (
          <div className="text-sm text-muted-foreground">{trend}</div>
        )}
      </div>
    </Card>
  );
}
