interface PriorityIndicatorProps {
  priority: string;
}

export function PriorityIndicator({ priority }: PriorityIndicatorProps) {
  const getColor = () => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
      <span className="text-sm capitalize" data-testid={`text-priority-${priority}`}>
        {priority}
      </span>
    </div>
  );
}
