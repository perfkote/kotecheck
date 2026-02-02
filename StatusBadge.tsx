// client/src/components/StatusBadge.tsx
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: "job" | "estimate";
}

export function StatusBadge({ status, type = "job" }: StatusBadgeProps) {
  const getStyle = () => {
    if (type === "job") {
      switch (status) {
        case "paid":
          return "bg-green-500/15 text-green-800 border-green-500/30";
        case "finished":
          return "bg-blue-500/15 text-blue-800 border-blue-500/30";
        case "coated":
          return "bg-purple-500/15 text-purple-800 border-purple-500/30";
        case "prepped":
          return "bg-yellow-500/15 text-yellow-800 border-yellow-500/30";
        case "received":
          return "bg-slate-500/15 text-slate-800 border-slate-500/30";
        case "on_hold":
          return "bg-amber-500/15 text-amber-800 border-amber-500/30";
        case "cancelled":
          return "bg-red-500/15 text-red-800 border-red-500/30";
        default:
          return "bg-slate-500/15 text-slate-800 border-slate-500/30";
      }
    } else {
      switch (status) {
        case "approved":
          return "bg-green-500/15 text-green-800 border-green-500/30";
        case "sent":
          return "bg-blue-500/15 text-blue-800 border-blue-500/30";
        case "draft":
          return "bg-slate-500/15 text-slate-800 border-slate-500/30";
        case "rejected":
          return "bg-red-500/15 text-red-800 border-red-500/30";
        default:
          return "bg-slate-500/15 text-slate-800 border-slate-500/30";
      }
    }
  };

  const formatStatus = (status: string) => {
    if (status === "on_hold") return "On Hold";
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  return (
    <Badge 
      variant="outline" 
      className={`text-xs px-2 py-0.5 font-medium border ${getStyle()}`}
      data-testid={`badge-status-${status}`}
    >
      {formatStatus(status)}
    </Badge>
  );
}
