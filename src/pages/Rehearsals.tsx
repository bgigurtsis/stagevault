
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Rehearsal, Performance } from "@/types";
import { rehearsalService } from "@/services/rehearsalService";
import { performanceService } from "@/services/performanceService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Rehearsals() {
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [performances, setPerformances] = useState<Record<string, Performance>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all rehearsals
        const rehearsalsData = await rehearsalService.getAllRehearsals();
        setRehearsals(rehearsalsData);

        // Fetch all performances to map them to rehearsals
        const performancesData = await performanceService.getPerformances();
        const performancesMap: Record<string, Performance> = {};
        performancesData.forEach(performance => {
          performancesMap[performance.id] = performance;
        });
        setPerformances(performancesMap);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load rehearsals. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const getRehearsalStatus = (date: string | undefined) => {
    if (!date) return "unscheduled";
    
    const now = new Date();
    const rehearsalDate = new Date(date);
    
    if (rehearsalDate < now) return "past";
    if (rehearsalDate.toDateString() === now.toDateString()) return "today";
    return "upcoming";
  };

  const getStatusBadge = (date: string | undefined) => {
    const status = getRehearsalStatus(date);
    
    switch (status) {
      case "today":
        return (
          <Badge variant="default" className="bg-[#F2FCE2] text-[#2E7D32] border-[#F2FCE2] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2E7D32]"></span>
            Today
          </Badge>
        );
      case "upcoming":
        return (
          <Badge variant="outline" className="text-[#E65100] border-[#FEC6A1] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E65100]"></span>
            Upcoming
          </Badge>
        );
      case "past":
        return (
          <Badge variant="outline" className="text-[#B71C1C] border-[#ea384c] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#B71C1C]"></span>
            Past
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[#4527A0] border-[#9b87f5] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#4527A0]"></span>
            Unscheduled
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Rehearsals</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Rehearsals</h1>
        <Button onClick={() => navigate("/rehearsals/new")} className="flex gap-1">
          <Plus className="h-4 w-4" /> New Rehearsal
        </Button>
      </div>

      {rehearsals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">No rehearsals yet</h2>
              <p className="text-muted-foreground">Create your first rehearsal to get started.</p>
              <Button onClick={() => navigate("/rehearsals/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create Rehearsal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rehearsals.map((rehearsal) => (
            <Link key={rehearsal.id} to={`/rehearsals/${rehearsal.id}`}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-2">{rehearsal.title}</CardTitle>
                    {getStatusBadge(rehearsal.date)}
                  </div>
                  <CardDescription>
                    {performances[rehearsal.performanceId]?.title || "Unknown Performance"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {rehearsal.date ? format(parseISO(rehearsal.date), "PPP") : "No date set"}
                    </span>
                  </div>
                  {rehearsal.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{rehearsal.location}</span>
                    </div>
                  )}
                  {rehearsal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {rehearsal.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="w-full text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {rehearsal.taggedUsers?.length ? (
                      <span>{rehearsal.taggedUsers.length} participants</span>
                    ) : (
                      <span>No participants</span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
