import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type?: "job" | "estimate";
}

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

  return (
    <Badge variant={getVariant()} data-testid={`badge-status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
    </Badge>
  );
}
