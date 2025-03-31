
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";

interface RecordingBreadcrumbProps {
  performanceId?: string;
  rehearsalId?: string;
  className?: string;
}

export function RecordingBreadcrumb({
  performanceId,
  rehearsalId,
  className = ""
}: RecordingBreadcrumbProps) {
  const [performanceTitle, setPerformanceTitle] = useState<string | null>(null);
  const [rehearsalTitle, setRehearsalTitle] = useState<string | null>(null);
  
  useEffect(() => {
    if (performanceId) {
      performanceService.getPerformanceById(performanceId)
        .then((performance) => {
          if (performance) {
            setPerformanceTitle(performance.title);
          }
        })
        .catch((error) => {
          console.error("Error fetching performance:", error);
        });
    }
    
    if (rehearsalId) {
      rehearsalService.getRehearsalById(rehearsalId)
        .then((rehearsal) => {
          if (rehearsal) {
            setRehearsalTitle(rehearsal.title);
            
            // If we don't have a performanceId yet, get it from the rehearsal
            if (!performanceId && rehearsal.performanceId) {
              performanceService.getPerformanceById(rehearsal.performanceId)
                .then((performance) => {
                  if (performance) {
                    setPerformanceTitle(performance.title);
                  }
                })
                .catch((error) => {
                  console.error("Error fetching performance from rehearsal:", error);
                });
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching rehearsal:", error);
        });
    }
  }, [performanceId, rehearsalId]);
  
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {performanceTitle ? (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/performances/${performanceId}`}>{performanceTitle}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/performances">Performances</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        
        <BreadcrumbSeparator />
        
        {rehearsalTitle ? (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/rehearsals/${rehearsalId}`}>{rehearsalTitle}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/rehearsals">Rehearsals</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbPage>Record</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
