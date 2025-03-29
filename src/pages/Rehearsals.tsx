
import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Search, Filter, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Rehearsal {
  id: string;
  title: string;
  date: Date;
  performanceTitle: string;
  performanceId: string;
  recordingsCount: number;
  durationMinutes: number;
}

// Mock data for rehearsals
const mockRehearsals: Rehearsal[] = [
  {
    id: "1",
    title: "First Run-through",
    date: new Date(2023, 5, 15),
    performanceTitle: "Nutcracker",
    performanceId: "p1",
    recordingsCount: 5,
    durationMinutes: 45
  },
  {
    id: "2",
    title: "Tech Rehearsal",
    date: new Date(2023, 5, 18),
    performanceTitle: "Nutcracker",
    performanceId: "p1",
    recordingsCount: 8,
    durationMinutes: 120
  },
  {
    id: "3",
    title: "Dress Rehearsal",
    date: new Date(2023, 5, 20),
    performanceTitle: "Nutcracker",
    performanceId: "p1",
    recordingsCount: 3,
    durationMinutes: 90
  },
  {
    id: "4",
    title: "First Rehearsal",
    date: new Date(2023, 6, 10),
    performanceTitle: "Swan Lake",
    performanceId: "p2",
    recordingsCount: 6,
    durationMinutes: 60
  },
  {
    id: "5",
    title: "Final Run-through",
    date: new Date(2023, 6, 15),
    performanceTitle: "Swan Lake",
    performanceId: "p2",
    recordingsCount: 7,
    durationMinutes: 110
  }
];

export default function Rehearsals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const isMobile = useIsMobile();
  
  // Filter rehearsals based on search query
  const filteredRehearsals = mockRehearsals.filter(rehearsal => 
    rehearsal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rehearsal.performanceTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort rehearsals by date
  const sortedRehearsals = [...filteredRehearsals].sort((a, b) => {
    const dateComparison = a.date.getTime() - b.date.getTime();
    return sortDirection === "asc" ? dateComparison : -dateComparison;
  });
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Rehearsals</h1>
          <Link to="/record" className="hidden md:block">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Recording
            </Button>
          </Link>
        </div>
        
        {/* Mobile-optimized search and filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rehearsals..."
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
                <h3 className="text-sm font-medium">Filter by Performance</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(mockRehearsals.map(r => r.performanceTitle))).map(title => (
                    <Button 
                      key={title} 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                    >
                      {title}
                    </Button>
                  ))}
                </div>
              </div>
              
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
        
        {/* Rehearsals Grid - responsive layout with cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRehearsals.length > 0 ? (
            sortedRehearsals.map((rehearsal) => (
              <Link key={rehearsal.id} to={`/rehearsals/${rehearsal.id}`} className="block">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{rehearsal.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Performance:</span>
                      <span className="font-medium text-foreground">{rehearsal.performanceTitle}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Date:</span>
                      <span className="font-medium text-foreground">{format(rehearsal.date, "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Recordings:</span>
                      <span className="font-medium text-foreground">{rehearsal.recordingsCount}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t">
                    <div className="w-full flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{Math.floor(rehearsal.durationMinutes / 60)}h {rehearsal.durationMinutes % 60}m</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/10">
              <p className="text-muted-foreground mb-4">No rehearsals found</p>
              <Link to="/record">
                <Button size={isMobile ? "sm" : "default"}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Recording
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
