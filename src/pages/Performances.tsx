
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Theater, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical,
  Edit,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPerformances } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Performances() {
  const [searchQuery, setSearchQuery] = useState("");
  const [performances, setPerformances] = useState(mockPerformances);
  
  const filteredPerformances = performances.filter(
    (performance) => 
      performance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performance.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Theater className="h-8 w-8" />
          <span>Performances</span>
        </h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search performances..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to="/performances/new">
            <Button className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              New Performance
            </Button>
          </Link>
        </div>
      </div>
      
      {filteredPerformances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Theater className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No performances found</h2>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {searchQuery 
              ? `No performances matching "${searchQuery}"`
              : "Get started by creating your first performance"}
          </p>
          <Link to="/performances/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Performance
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPerformances.map((performance) => (
            <Card key={performance.id} className="overflow-hidden flex flex-col">
              <Link to={`/performances/${performance.id}`} className="flex-1">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {performance.coverImage ? (
                    <img
                      src={performance.coverImage}
                      alt={performance.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Theater className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-1">{performance.title}</h2>
                  {performance.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {performance.description}
                    </p>
                  )}
                </CardContent>
              </Link>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formatDate(performance.startDate)}
                    {performance.endDate && ` - ${formatDate(performance.endDate)}`}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
