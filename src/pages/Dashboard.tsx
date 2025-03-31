
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Theater, ArrowRight, Clock, Plus, Calendar, Search, Video, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Performance, Recording } from "@/types";
import { performanceService } from "@/services/performanceService";
import { recordingService } from "@/services/recordingService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch performances with React Query
  const {
    data: performances = [],
    isLoading: isLoadingPerformances,
    error: performancesError,
    refetch: refetchPerformances
  } = useQuery({
    queryKey: ["dashboard-performances"],
    queryFn: async () => {
      try {
        return await performanceService.getPerformances();
      } catch (error) {
        console.error("Error fetching performances:", error);
        throw error;
      }
    }
  });

  // Fetch recordings with React Query
  const {
    data: recordings = [],
    isLoading: isLoadingRecordings,
    error: recordingsError,
    refetch: refetchRecordings
  } = useQuery({
    queryKey: ["dashboard-recordings"],
    queryFn: async () => {
      try {
        return await recordingService.getRecentRecordings();
      } catch (error) {
        console.error("Error fetching recordings:", error);
        return [];
      }
    }
  });

  const recentPerformances = performances.slice(0, 3);
  const recentRecordings = recordings.slice(0, 3);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (seconds: number | undefined) => {
    if (!seconds) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle retrying failed requests
  const handleRetry = () => {
    if (performancesError) refetchPerformances();
    if (recordingsError) refetchRecordings();
    
    toast({
      title: "Retrying",
      description: "Attempting to fetch your data again...",
    });
  };

  const isLoading = isLoadingPerformances || isLoadingRecordings;
  const hasError = performancesError || recordingsError;

  if (isLoading) {
    return <div className="container max-w-6xl py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        
        <Skeleton className="h-14 w-full" />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full" />)}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full" />)}
          </div>
        </div>
      </div>;
  }

  if (hasError && !isLoading) {
    return <div className="container max-w-6xl py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}
          </p>
        </div>
      </div>
      
      <div className="bg-destructive/10 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          We encountered a problem while loading your dashboard data. This could be due to a network issue or a temporary server problem.
        </p>
        <Button onClick={handleRetry}>
          Try Again
        </Button>
      </div>
    </div>;
  }

  return <div className="container max-w-6xl py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your dance performances, rehearsals, and recordings
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/performances">
            <Button variant="outline">View Performances</Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/performances/new" className="flex items-center">
                  <Theater className="mr-2 h-4 w-4" />
                  <span>New Performance</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/record" className="flex items-center">
                  <Video className="mr-2 h-4 w-4" />
                  <span>Record Video</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder="Search anything..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Performances</h2>
          <Link to="/performances" className="text-sm text-primary flex items-center hover:underline">
            <span>View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentPerformances.length === 0 ? <Card>
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
          </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPerformances.map(performance => <Card key={performance.id} className="flex flex-col overflow-hidden">
                <Link to={`/performances/${performance.id}`} className="group">
                  <div className="aspect-video bg-muted flex items-center justify-center p-4">
                    <Theater className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{performance.title}</CardTitle>
                    {performance.description && <CardDescription className="line-clamp-2">
                        {performance.description}
                      </CardDescription>}
                  </CardHeader>
                </Link>
                <CardContent className="p-4 pt-0 mt-auto">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {performance.startDate ? formatDate(performance.startDate) : "No date set"}
                    </span>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Recordings</h2>
          <Link to="/recordings" className="text-sm text-primary flex items-center hover:underline">
            <span>View all</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentRecordings.length === 0 ? <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No recordings yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                Record your first video to get started
              </p>
              <Link to="/record">
                <Button>
                  <Search className="mr-1 h-4 w-4" />
                  Record Video
                </Button>
              </Link>
            </CardContent>
          </Card> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecordings.map(recording => <Card key={recording.id} className="flex flex-col overflow-hidden">
                <Link to={`/recordings/${recording.id}`} className="group">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {recording.thumbnailUrl ? <img src={recording.thumbnailUrl} alt={recording.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Search className="h-10 w-10 text-muted-foreground/50" />
                      </div>}
                    
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(recording.duration)}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{recording.title}</CardTitle>
                    {recording.notes && <CardDescription className="line-clamp-2">
                        {recording.notes}
                      </CardDescription>}
                  </CardHeader>
                </Link>
                <CardContent className="p-4 pt-0 mt-auto">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {recording.createdAt ? formatDate(recording.createdAt) : "No date"}
                    </span>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
}
