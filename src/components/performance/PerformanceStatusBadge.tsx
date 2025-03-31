
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
          color: "#F2FCE2",
          textColor: "#2E7D32"
        };
      case "upcoming":
        return {
          label: "Upcoming",
          variant: "outline" as const,
          color: "#FEC6A1",
          textColor: "#E65100"
        };
      case "past":
        return {
          label: "Past",
          variant: "outline" as const,
          color: "#ea384c",
          textColor: "#B71C1C"
        };
      default:
        return {
          label: "Unscheduled",
          variant: "outline" as const,
          color: "#9b87f5",
          textColor: "#4527A0"
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
