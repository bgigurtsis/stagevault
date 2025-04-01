
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Film, Plus, Search, Calendar, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Recording } from "@/types";
import { recordingService } from "@/services/recordingService";

export default function Recordings() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    data: recordings = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      return recordingService.getAllRecordings();
    }
  });

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Recordings</h1>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>Error loading recordings. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
        <Link to="/record">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Recording
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <ListFilter className="h-4 w-4" />
        </Button>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="text-center py-12">
          <Film className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No recordings found</h2>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? "No recordings match your search criteria"
              : "Start by creating your first recording"}
          </p>
          {!searchQuery && (
            <Link to="/record" className="mt-4 inline-block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Video
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <Link key={recording.id} to={`/recordings/${recording.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{recording.title}</CardTitle>
                  <CardDescription>{formatDate(recording.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="h-full w-full object-cover rounded-md"
                      />
                    ) : (
                      <Film className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      {recording.duration
                        ? `${Math.floor(recording.duration / 60)}:${(recording.duration % 60)
                            .toString()
                            .padStart(2, "0")}`
                        : "Duration unknown"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
