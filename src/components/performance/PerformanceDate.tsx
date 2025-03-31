
import { Calendar } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface PerformanceDateProps {
  startDate?: string;
  endDate?: string;
}

export function PerformanceDate({ startDate, endDate }: PerformanceDateProps) {
  if (!startDate) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-1.5" />
        <span>No dates set</span>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Invalid date";
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
      <span>
        {endDate 
          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
          : formatDate(startDate)
        }
      </span>
    </div>
  );
}
