
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Theater, 
  PlaySquare, 
  Video, 
  ArrowRight,
  Clock,
  Plus,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { mockPerformances, mockRehearsals, mockRecordings } from "@/types";

export default function Dashboard() {
  const { currentUser } = useAuth();
  
  // Filter to only show recent items (in a real app, these would be sorted by date)
  const recentPerformances = mockPerformances.slice(0, 3);
  const recentRehearsals = mockRehearsals.slice(0, 3);
  const recentRecordings = mockRecordings.slice(0, 4);
  
  const totalPerformances = mockPerformances.length;
  const totalRehearsals = mockRehearsals.length;
  const totalRecordings = mockRecordings.length;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };
  
  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your dance performances, rehearsals, and recordings
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/performances">
            <Button variant="outline">View All Performances</Button>
          </Link>
          <Link to="/record">
            <Button>
              <Video className="mr-2 h-4 w-4" />
              Record New Video
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Performances</p>
                <p className="text-3xl font-bold">{totalPerformances}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Theater className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2">
            <Link to="/performances" className="text-sm text-primary flex items-center hover:underline">
              <span>View all performances</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rehearsals</p>
                <p className="text-3xl font-bold">{totalRehearsals}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <PlaySquare className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2">
            <Link to="/rehearsals" className="text-sm text-primary flex items-center hover:underline">
              <span>View all rehearsals</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recordings</p>
                <p className="text-3xl font-bold">{totalRecordings}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Video className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 pb-2">
            <Link to="/recordings" className="text-sm text-primary flex items-center hover:underline">
              <span>View all recordings</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Recent performances */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Performances</h2>
          <Link to="/performances" className="text-sm text-primary flex items-center hover:underline">
            <span>View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentPerformances.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Theater className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No performances yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                Create your first performance to get started
              </p>
              <Link to="/performances/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Performance
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPerformances.map((performance) => (
              <Card key={performance.id} className="flex flex-col overflow-hidden">
                <Link to={`/performances/${performance.id}`} className="group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {performance.coverImage ? (
                      <img
                        src={performance.coverImage}
                        alt={performance.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Theater className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{performance.title}</CardTitle>
                    {performance.description && (
                      <CardDescription className="line-clamp-2">
                        {performance.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Link>
                <CardContent className="p-4 pt-0 mt-auto">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {performance.startDate 
                        ? formatDate(performance.startDate)
                        : "No date set"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Recent recordings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Recordings</h2>
          <Link to="/recordings" className="text-sm text-primary flex items-center hover:underline">
            <span>View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentRecordings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Video className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No recordings yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                Record your first video to get started
              </p>
              <Link to="/record">
                <Button>
                  <Video className="mr-2 h-4 w-4" />
                  Record Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentRecordings.map((recording) => (
              <Card key={recording.id} className="overflow-hidden">
                <Link to={`/recordings/${recording.id}`} className="group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Video className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(recording.duration)}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{recording.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recording.createdAt ? formatDate(recording.createdAt) : "No date"}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Upcoming rehearsals */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Rehearsals</h2>
          <Link to="/rehearsals" className="text-sm text-primary flex items-center hover:underline">
            <span>View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentRehearsals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <PlaySquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No upcoming rehearsals</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                Schedule your first rehearsal
              </p>
              <Link to="/rehearsals/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rehearsal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentRehearsals.map((rehearsal) => {
              const relatedPerformance = mockPerformances.find(
                (p) => p.id === rehearsal.performanceId
              );
              
              return (
                <Card key={rehearsal.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <PlaySquare className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <Link to={`/rehearsals/${rehearsal.id}`} className="group">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {rehearsal.title}
                          </h3>
                        </Link>
                        {relatedPerformance && (
                          <Link to={`/performances/${relatedPerformance.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {relatedPerformance.title}
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(rehearsal.date)}</span>
                        </div>
                        
                        {rehearsal.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <PlaySquare className="h-4 w-4" />
                            <span>{rehearsal.location}</span>
                          </div>
                        )}
                        
                        {rehearsal.taggedUsers && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{rehearsal.taggedUsers.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
