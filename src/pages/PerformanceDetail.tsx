
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Theater, 
  Calendar, 
  Clock,
  MapPin,
  Users,
  Plus,
  PlayCircle,
  ArrowLeft,
  Edit,
  Trash,
  MoreVertical,
  Flag,
  FolderPlus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuthContext";
import { performanceService } from "@/services/performanceService";
import { rehearsalService } from "@/services/rehearsalService";
import { googleDriveService } from "@/services/googleDriveService";
import { Performance, Rehearsal } from "@/types";

export default function PerformanceDetail() {
  const { performanceId } = useParams<{ performanceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreatingDriveFolder, setIsCreatingDriveFolder] = useState(false);

  // Fetch performance details
  const { 
    data: performance,
    isLoading: isLoadingPerformance,
    error: performanceError 
  } = useQuery({
    queryKey: ["performance", performanceId],
    queryFn: async () => {
      if (!performanceId) return null;
      console.log("Fetching performance details for ID:", performanceId);
      const data = await performanceService.getPerformanceById(performanceId);
      console.log("Performance details fetched:", data);
      return data;
    },
    enabled: !!performanceId,
  });

  // Fetch rehearsals for this performance
  const { 
    data: rehearsals = [],
    isLoading: isLoadingRehearsals,
    error: rehearsalsError 
  } = useQuery({
    queryKey: ["rehearsals", performanceId],
    queryFn: async () => {
      if (!performanceId) return [];
      return await rehearsalService.getRehearsalsByPerformance(performanceId);
    },
    enabled: !!performanceId,
  });

  // Handle performance deletion
  const handleDeletePerformance = async () => {
    if (!performanceId) return;
    
    try {
      const success = await performanceService.deletePerformance(performanceId);
      
      if (success) {
        toast({
          title: "Performance deleted",
          description: "Performance has been deleted successfully.",
        });
        navigate("/performances");
      } else {
        throw new Error("Failed to delete performance");
      }
    } catch (error) {
      console.error("Error deleting performance:", error);
      toast({
        title: "Error",
        description: "Failed to delete performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Get user information
  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId) || null;
  };

  // Sort rehearsals by date (most recent first)
  const sortedRehearsals = [...rehearsals].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Debug function to create Google Drive folder manually
  const createGoogleDriveFolder = async () => {
    if (!performance) {
      toast({
        title: "Error",
        description: "Performance details not available",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingDriveFolder(true);
    try {
      const folderId = await googleDriveService.ensureFolderStructure(
        performance.title, 
        "Debug Test Rehearsal"
      );
      
      if (folderId) {
        toast({
          title: "Folder Created",
          description: "Google Drive folder has been created successfully",
        });
      } else {
        throw new Error("Failed to create Google Drive folder");
      }
    } catch (error) {
      console.error("Error creating Google Drive folder:", error);
      toast({
        title: "Error",
        description: "Failed to create Google Drive folder. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDriveFolder(false);
    }
  };

  if (isLoadingPerformance) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (performanceError || !performance) {
    return (
      <div className="container py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/performances")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Performance Not Found</h1>
        </div>
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>Could not load the performance details. The performance may have been deleted or you don't have permission to view it.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate("/performances")}
          >
            Return to Performances
          </Button>
        </div>
        <div className="mt-4">
          <p>Debug Information:</p>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs mt-2">
            Performance ID: {performanceId}
            Error: {(performanceError as Error)?.message || "Unknown error"}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/performances")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Theater className="h-7 w-7" />
              {performance.title}
            </h1>
            <p className="text-muted-foreground">
              {performance.startDate && `${formatDate(performance.startDate)}${performance.endDate ? ` - ${formatDate(performance.endDate)}` : ''}`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={createGoogleDriveFolder}
            disabled={isCreatingDriveFolder}
          >
            {isCreatingDriveFolder ? (
              <>Creating Folder...</>
            ) : (
              <>
                <FolderPlus className="mr-2 h-4 w-4" />
                Test Drive Folder
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate(`/rehearsals/new?performanceId=${performance.id}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Rehearsal
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/performances/${performance.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Performance</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete Performance</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Performance Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rehearsals">
                Rehearsals ({sortedRehearsals.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Performance Details */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Performance Details</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performance.description && (
                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{performance.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium mb-2">Date & Time</h3>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {performance.startDate ? (
                          <>
                            {formatDate(performance.startDate)}
                            {performance.endDate && ` - ${formatDate(performance.endDate)}`}
                          </>
                        ) : (
                          "No dates set"
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Created by */}
                  <div>
                    <h3 className="font-medium mb-2">Created by</h3>
                    <div className="flex items-center">
                      {(() => {
                        const creator = getUserById(performance.createdBy);
                        return (
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={creator?.profilePicture} />
                              <AvatarFallback>{creator?.name.split(" ").map(n => n[0]).join("") || "?"}</AvatarFallback>
                            </Avatar>
                            <span>{creator?.name || "Unknown User"}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Tagged Users */}
                  {performance.taggedUsers && performance.taggedUsers.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Performers</h3>
                      <div className="flex flex-wrap gap-2">
                        {performance.taggedUsers.map(userId => {
                          const user = getUserById(userId);
                          return (
                            <Badge key={userId} variant="outline" className="flex items-center">
                              <Avatar className="h-5 w-5 mr-1">
                                <AvatarImage src={user?.profilePicture} />
                                <AvatarFallback className="text-[10px]">{user?.name.split(" ").map(n => n[0]).join("") || "?"}</AvatarFallback>
                              </Avatar>
                              <span>{user?.name || "Unknown User"}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Rehearsals Preview */}
              {sortedRehearsals.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Rehearsals</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setActiveTab("rehearsals")}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sortedRehearsals.slice(0, 3).map((rehearsal) => (
                        <Link 
                          key={rehearsal.id} 
                          to={`/rehearsals/${rehearsal.id}`} 
                          className="block"
                        >
                          <div className="flex items-start p-3 rounded-lg hover:bg-muted">
                            <div className="flex-1">
                              <h3 className="font-medium">{rehearsal.title}</h3>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                <span>{new Date(rehearsal.date).toLocaleDateString()}</span>
                                {rehearsal.location && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <MapPin className="h-3.5 w-3.5 mr-1" />
                                    <span>{rehearsal.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <PlayCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                  {sortedRehearsals.length > 3 && (
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("rehearsals")}
                      >
                        View All {sortedRehearsals.length} Rehearsals
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="rehearsals">
              {/* Rehearsals List */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Rehearsals</h2>
                  <Button 
                    onClick={() => navigate(`/rehearsals/new?performanceId=${performance.id}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rehearsal
                  </Button>
                </div>
                
                {isLoadingRehearsals ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : rehearsalsError ? (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <p>Could not load rehearsals. Please try again later.</p>
                  </div>
                ) : sortedRehearsals.length === 0 ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto bg-muted h-16 w-16 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">No rehearsals yet</h3>
                      <p className="text-muted-foreground">Create your first rehearsal to get started</p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/rehearsals/new?performanceId=${performance.id}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Rehearsal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedRehearsals.map((rehearsal) => (
                      <Card key={rehearsal.id}>
                        <Link to={`/rehearsals/${rehearsal.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-lg">{rehearsal.title}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3.5 w-3.5 mr-1" />
                                  <span>{new Date(rehearsal.date).toLocaleDateString()}</span>
                                  {rehearsal.location && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <MapPin className="h-3.5 w-3.5 mr-1" />
                                      <span>{rehearsal.location}</span>
                                    </>
                                  )}
                                </div>
                                {rehearsal.description && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {rehearsal.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                {rehearsal.taggedUsers && rehearsal.taggedUsers.length > 0 && (
                                  <div className="flex -space-x-2 mr-4">
                                    {rehearsal.taggedUsers.slice(0, 3).map((userId, index) => {
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
                                    {rehearsal.taggedUsers.length > 3 && (
                                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                                        +{rehearsal.taggedUsers.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          {/* Cover Image */}
          <Card className="overflow-hidden">
            {performance.coverImage ? (
              <div className="aspect-video w-full">
                <img
                  src={performance.coverImage}
                  alt={performance.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-muted flex items-center justify-center">
                <Theater className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            <CardFooter className="p-4 flex justify-center">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate(`/performances/${performance.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Performance
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this performance?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the performance
              and all associated rehearsals and recordings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePerformance}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
