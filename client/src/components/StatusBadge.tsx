import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: "job" | "estimate";
}

const JOB_STATUS_LABELS: Record<string, string> = {
  received: "Received",
  prepped: "Prepped",
  coated: "Coated",
  finished: "Ready for Pickup",
  on_hold: "On Hold",
  paid: "Paid",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, type = "job" }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === "job") {
      switch (status) {
        case "paid":
          return "default";
        case "finished":
          return "secondary";
        case "coated":
          return "secondary";
        case "prepped":
          return "outline";
        case "received":
          return "outline";
        case "on_hold":
          return "outline";
        case "cancelled":
          return "destructive";
        default:
          return "outline";
      }
    } else {
      switch (status) {
        case "approved":
          return "default";
        case "sent":
          return "secondary";
        case "draft":
          return "outline";
        case "rejected":
          return "destructive";
        default:
          return "outline";
      }
    }
  };

  const label = type === "job" && JOB_STATUS_LABELS[status]
    ? JOB_STATUS_LABELS[status]
    : status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ").replace("-", " ");

  return (
    <Badge variant={getVariant()} data-testid={`badge-status-${status}`}>
      {label}
    </Badge>
  );
}
