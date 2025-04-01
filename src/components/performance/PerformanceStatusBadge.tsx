
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";
import { useMemo } from "react";

interface PerformanceStatusBadgeProps {
  startDate?: string;
  endDate?: string;
}

export function PerformanceStatusBadge({ startDate, endDate }: PerformanceStatusBadgeProps) {
  const status = useMemo(() => {
    if (!startDate) return "unscheduled";
    
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (end && now > end) return "past";
    if (now >= start && (!end || now <= end)) return "active";
    if (start > now) return "upcoming";
    
    return "unscheduled";
  }, [startDate, endDate]);
  
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          variant: "default" as const, 
          color: "#E8F5E9", // Light green background
          textColor: "#2E7D32" // Dark green text
        };
      case "upcoming":
        return {
          label: "Upcoming",
          variant: "outline" as const,
          color: "#FEF4E6", // Light orange background
          textColor: "#E67E22" // Orange text (our primary)
        };
      case "past":
        return {
          label: "Past",
          variant: "outline" as const,
          color: "#FDEDEC", // Light red background
          textColor: "#C0392B" // Dark red text
        };
      default:
        return {
          label: "Unscheduled",
          variant: "outline" as const,
          color: "#F4F6F7", // Light gray background
          textColor: "#7F8C8D" // Medium gray text
        };
    }
  };
  
  const { label, variant, color, textColor } = getStatusConfig();
  
  return (
    <Badge 
      variant={variant} 
      className="flex items-center gap-1.5 font-medium" 
      style={{ backgroundColor: variant === "outline" ? "transparent" : color, 
              color: textColor, 
              borderColor: color }}
    >
      <Circle className="h-2 w-2 fill-current" />
      {label}
    </Badge>
  );
}
