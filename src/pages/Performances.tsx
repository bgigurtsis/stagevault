
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Theater, 
  Plus, 
  Search, 
  Calendar, 
  MoreVertical,
  Edit,
  Trash,
  Filter,
  ArrowUp,
  ArrowDown,
  Users,
  PlaySquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockPerformances, mockRehearsals } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";

export default function Performances() {
  const { users } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [performances, setPerformances] = useState(mockPerformances);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Filter performances based on search query
  const filteredPerformances = performances.filter(
    (performance) => 
      performance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      performance.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort performances by date
  const sortedPerformances = [...filteredPerformances].sort((a, b) => {
    if (!a.startDate || !b.startDate) return 0;
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Count rehearsals for each performance
  const getRehearsalCount = (performanceId: string) => {
    return mockRehearsals.filter(rehearsal => rehearsal.performanceId === performanceId).length;
  };

  // Get user information from userId
  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId) || null;
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Theater className="h-8 w-8" />
          <span>Performances</span>
        </h1>
        <Link to="/performances/new">
          <Button className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" />
            New Performance
          </Button>
        </Link>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search performances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
        
        <Collapsible
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          className="md:w-auto"
        >
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 md:flex-none" onClick={toggleSortDirection}>
              Sort by Date {sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
            </Button>
            
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4 md:hidden">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Date Range</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  Start
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  End
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {sortedPerformances.length === 0 ? (
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
          {sortedPerformances.map((performance) => (
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
                  
                  {/* Rehearsal count */}
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <PlaySquare className="h-4 w-4 mr-1" />
                    <span>{getRehearsalCount(performance.id)} rehearsals</span>
                  </div>
                  
                  {/* Performers list */}
                  {performance.taggedUsers && performance.taggedUsers.length > 0 && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex -space-x-2 overflow-hidden">
                        {performance.taggedUsers.slice(0, 3).map((userId, index) => {
                          const user = getUserById(userId);
                          return (
                            <Avatar key={index} className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={user?.profilePicture} />
                              <AvatarFallback className="text-[10px]">
                                {user ? user.name.split(" ").map(n => n[0]).join("") : userId.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })}
                        {performance.taggedUsers.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium">
                            +{performance.taggedUsers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
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
