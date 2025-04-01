import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Performance, Rehearsal, Recording } from "@/types";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { recordingService } from "@/services/recordingService";
import { PerformanceThumbnail } from "@/components/performance/PerformanceThumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Video, Calendar, ListChecks } from "lucide-react";

export default function Dashboard() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [recentRehearsals, setRecentRehearsals] = useState<Rehearsal[]>([]);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const performancesData = await performanceService.getPerformances();
        setPerformances(performancesData);

        const recentRehearsals = await rehearsalService.getRehearsals();
        setRecentRehearsals(recentRehearsals);

        const recentRecordings = await recordingService.getRecentRecordings(5);
        setRecentRecordings(recentRecordings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container py-6 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Performances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px] w-full" />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Rehearsals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px] w-full" />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Recordings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px] w-full" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recent Performances</h2>
          <Link to="/performances" className="text-sm font-medium hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performances.slice(0, 3).map((performance) => (
            <Link key={performance.id} to={`/performances/${performance.id}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{performance.title}</CardTitle>
                  <CardDescription>
                    Created {formatDistanceToNow(new Date(performance.createdAt), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceThumbnail 
                  title={performance.title} 
                  patternType={[
                    "chevrons",
                    "octogons",
                    "overlappingCircles",
                    "plusSigns",
                    "xes", 
                    "hexagons",
                    "overlappingRings",
                    "triangles",
                    "nestedSquares",
                    "mosaicSquares",
                    "diamonds",
                    "tessellation"
                  ]} 
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recent Rehearsals</h2>
          <Link to="/rehearsals" className="text-sm font-medium hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRehearsals.slice(0, 3).map((rehearsal) => (
            <Link key={rehearsal.id} to={`/rehearsals/${rehearsal.id}`}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>{rehearsal.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {formatDistanceToNow(new Date(rehearsal.date), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {rehearsal.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ListChecks className="h-4 w-4" />
                    {rehearsal.description}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Recent Recordings</h2>
          <Link to="/recordings" className="text-sm font-medium hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentRecordings.slice(0, 3).map((recording) => (
            <Link key={recording.id} to={`/recordings/${recording.id}`}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{recording.title}</CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(new Date(recording.createdAt), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
