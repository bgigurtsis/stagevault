
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  Theater, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash,
  Filter,
  ArrowUp,
  ArrowDown,
  Users,
  PlaySquare,
  AlertTriangle,
  Loader2,
  Calendar // Add Calendar import here
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { Performance } from "@/types";
import { PerformanceStatusBadge } from "@/components/performance/PerformanceStatusBadge";
import { PerformanceDate } from "@/components/performance/PerformanceDate";

export default function Performances() {
  const { users, currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [performanceToDelete, setPerformanceToDelete] = useState<Performance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    data: performances = [], 
    isLoading: isLoadingPerformances, 
    error: performancesError,
    refetch: refetchPerformances
  } = useQuery({
    queryKey: ["performances"],
    queryFn: async () => {
      return await performanceService.getPerformances();
    }
  });
  
  const { 
    data: rehearsals = [],
    isLoading: isLoadingRehearsals
  } = useQuery({
    queryKey: ["rehearsals"],
    queryFn: async () => {
      return await rehearsalService.getAllRehearsals();
    }
  });

  const deletePerformanceMutation = useMutation({
    mutationFn: async (performanceId: string) => {
      return await performanceService.deletePerformance(performanceId);
    },
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: () => {
      toast({
        title: "Performance deleted",
        description: `"${performanceToDelete?.title}" has been deleted successfully.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["performances"] });
      
      setPerformanceToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting performance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete performance. Please try again.",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const filteredPerformances = performances.filter(
    (performance) => 
      performance.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (performance.description && performance.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
  
  const getRehearsalCount = (performanceId: string) => {
    return rehearsals.filter(rehearsal => rehearsal.performanceId === performanceId).length;
  };

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId) || null;
  };
  
  const handleDeletePerformance = async () => {
    if (!performanceToDelete) return;
    deletePerformanceMutation.mutate(performanceToDelete.id);
  };

  const handleRetry = () => {
    refetchPerformances();
  };

  const isLoading = isLoadingPerformances || isLoadingRehearsals;

  if (performancesError && !isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Theater className="h-8 w-8" />
            <span>Performances</span>
          </h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Error loading performances</h2>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {(performancesError as Error).message || "Failed to fetch performances. Please try again."}
          </p>
          <Button onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none" 
              onClick={toggleSortDirection}
              disabled={isLoading}
            >
              Sort by Date {sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
            </Button>
            
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="md:hidden" disabled={isLoading}>
                <Filter className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="mt-4 space-y-4 rounded-md border p-4 md:hidden">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Date Range</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={isLoading}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Start
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled={isLoading}>
                  <Calendar className="mr-2 h-4 w-4" />
                  End
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading performances...</p>
        </div>
      ) : sortedPerformances.length === 0 ? (
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
                <div className="aspect-video bg-muted flex items-center justify-center p-4">
                  <Theater className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{performance.title}</h3>
                    <PerformanceStatusBadge 
                      startDate={performance.startDate} 
                      endDate={performance.endDate} 
                    />
                  </div>
                  {performance.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{performance.description}</p>
                  )}
                  <div className="space-y-2 mt-2">
                    <PerformanceDate 
                      startDate={performance.startDate} 
                      endDate={performance.endDate}
                    />
                    <div className="flex items-center text-sm text-muted-foreground">
                      <PlaySquare className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span>{getRehearsalCount(performance.id)} {getRehearsalCount(performance.id) === 1 ? "rehearsal" : "rehearsals"}</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
              <CardFooter className="p-4 pt-0 flex items-center justify-end border-t mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/performances/${performance.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setPerformanceToDelete(performance)}
                      disabled={isDeleting}
                    >
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
      
      <AlertDialog open={!!performanceToDelete} onOpenChange={(open) => !open && setPerformanceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the performance "{performanceToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePerformance} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
