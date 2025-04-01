import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Performance, Rehearsal, Recording } from "@/types";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { recordingService } from "@/services/recordingService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ListVideo, Music, PlaySquare, Video } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import geoPattern from 'geopattern';

export default function Dashboard() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const performanceData = await performanceService.getPerformances();
        const rehearsalData = await rehearsalService.getRehearsals();
        const recordingData = await recordingService.getRecentRecordings();

        setPerformances(performanceData);
        setRehearsals(rehearsalData);
        setRecordings(recordingData);
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
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here's a summary of your recent activity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Performances</CardTitle>
              <CardDescription>Recent performances</CardDescription>
            </CardHeader>
            <CardContent>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rehearsals</CardTitle>
              <CardDescription>Recent rehearsals</CardDescription>
            </CardHeader>
            <CardContent>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recordings</CardTitle>
              <CardDescription>Recent recordings</CardDescription>
            </CardHeader>
            <CardContent>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Here's a summary of your recent activity.
          </p>
        </div>
        <Link to="/record">
          <Button className="bg-red-500 hover:bg-red-600">
            <Video className="mr-2 h-4 w-4" />
            Quick Record
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Performances</CardTitle>
                <CardDescription>Recent performances</CardDescription>
              </div>
              <Link to="/performances">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {performances.length === 0 ? (
              <div className="text-center py-6">
                <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent performances</p>
              </div>
            ) : (
              performances.map((performance) => {
                const pattern = geoPattern.generate(performance.title, {
                  baseColor: "#2a6b9c"
                }).toString();

                return (
                  <Link key={performance.id} to={`/performances/${performance.id}`} className="block">
                    <div className="flex items-center space-x-4 p-3 rounded-md hover:bg-secondary transition-colors">
                      <div className="w-10 h-10 rounded-md flex-shrink-0" style={{
                        backgroundImage: `url(${pattern})`,
                        backgroundSize: 'cover',
                      }} />
                      <div>
                        <p className="font-medium line-clamp-1">{performance.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(performance.startDate), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
            {user && (
              <Link to="/performances/new">
                <Button variant="link" className="w-full justify-start">
                  <PlaySquare className="mr-2 h-4 w-4" />
                  Create Performance
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Rehearsals</CardTitle>
                <CardDescription>Recent rehearsals</CardDescription>
              </div>
              <Link to="/rehearsals">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rehearsals.length === 0 ? (
              <div className="text-center py-6">
                <ListVideo className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent rehearsals</p>
              </div>
            ) : (
              rehearsals.map((rehearsal) => (
                <Link key={rehearsal.id} to={`/rehearsals/${rehearsal.id}`} className="block">
                  <div className="flex items-center space-x-4 p-3 rounded-md hover:bg-secondary transition-colors">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{rehearsal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(rehearsal.date), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <Link to="/rehearsal">
              <Button variant="link" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Rehearsal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Recordings</CardTitle>
                <CardDescription>Recent recordings</CardDescription>
              </div>
              <Link to="/recordings">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recordings.length === 0 ? (
              <div className="text-center py-6">
                <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No recent recordings</p>
              </div>
            ) : (
              recordings.map((recording) => (
                <Link key={recording.id} to={`/recordings/${recording.id}`} className="block">
                  <div className="flex items-center space-x-4 p-3 rounded-md hover:bg-secondary transition-colors">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1">{recording.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(recording.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
            <Link to="/record">
              <Button variant="link" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                New Recording
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
