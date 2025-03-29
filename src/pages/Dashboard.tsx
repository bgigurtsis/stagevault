
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Theater, 
  ArrowRight,
  Clock,
  Plus,
  Calendar,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { mockPerformances, mockRehearsals, mockRecordings } from "@/types";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter to only show recent items (in a real app, these would be sorted by date)
  const recentPerformances = mockPerformances.slice(0, 3);
  const recentRecordings = mockRecordings.slice(0, 3); // Show same number as performances
  
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
              <Search className="mr-2 h-4 w-4" />
              Record New Video
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Global Search Bar - replacing stats section */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search across people, performances, rehearsals, and recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg"
        />
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
      
      {/* Recent recordings - updated to match performance card style */}
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
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No recordings yet</h3>
              <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                Record your first video to get started
              </p>
              <Link to="/record">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Record Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRecordings.map((recording) => (
              <Card key={recording.id} className="flex flex-col overflow-hidden">
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
                        <Search className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(recording.duration)}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{recording.title}</CardTitle>
                    {recording.notes && (
                      <CardDescription className="line-clamp-2">
                        {recording.notes}
                      </CardDescription>
                    )}
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
