
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Theater, 
  ArrowLeft, 
  Calendar, 
  Users,
  Pencil,
  Plus,
  MoreVertical,
  Edit,
  Trash,
  PlaySquare,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPerformances, mockRehearsals } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function PerformanceDetail() {
  const { performanceId } = useParams<{ performanceId: string }>();
  const [performance, setPerformance] = useState(
    mockPerformances.find((p) => p.id === performanceId)
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const relatedRehearsals = mockRehearsals.filter(
    (rehearsal) => rehearsal.performanceId === performanceId
  );
  
  useEffect(() => {
    if (!performance) {
      toast({
        title: "Performance not found",
        description: "The performance you're looking for doesn't exist.",
        variant: "destructive",
      });
      navigate("/performances");
    }
  }, [performance, navigate, toast]);
  
  if (!performance) {
    return null;
  }
  
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
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/performances">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Performance Details</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video bg-muted relative overflow-hidden">
              {performance.coverImage ? (
                <img
                  src={performance.coverImage}
                  alt={performance.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Theater className="h-20 w-20 text-muted-foreground/50" />
                </div>
              )}
              <Button
                size="icon"
                className="absolute top-4 right-4"
                variant="secondary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{performance.title}</CardTitle>
              {performance.description && (
                <CardDescription className="text-base">
                  {performance.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(performance.startDate)}
                      {performance.endDate && ` - ${formatDate(performance.endDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Performers</p>
                    <p className="text-sm text-muted-foreground">
                      {performance.taggedUsers?.length || 0} performers
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="rehearsals">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="rehearsals">Rehearsals</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              <Link to={`/rehearsals/new?performanceId=${performanceId}`}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Rehearsal
                </Button>
              </Link>
            </div>
            
            <TabsContent value="rehearsals" className="mt-0">
              {relatedRehearsals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <PlaySquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">No rehearsals yet</h2>
                    <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                      Add your first rehearsal to start tracking your progress
                    </p>
                    <Link to={`/rehearsals/new?performanceId=${performanceId}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Rehearsal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {relatedRehearsals.map((rehearsal) => (
                    <Card key={rehearsal.id}>
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <Link to={`/rehearsals/${rehearsal.id}`} className="flex-1">
                            <CardTitle className="text-lg hover:text-primary transition-colors">
                              {rehearsal.title}
                            </CardTitle>
                          </Link>
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
                        </div>
                        {rehearsal.description && (
                          <CardDescription className="mt-1">
                            {rehearsal.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex flex-wrap gap-4 text-sm">
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">Timeline view</h2>
                    <p className="text-muted-foreground mt-1 mb-4 max-w-md">
                      The timeline feature will be available in a future update
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/rehearsals/new?performanceId=${performanceId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <PlaySquare className="mr-2 h-4 w-4" />
                  Create New Rehearsal
                </Button>
              </Link>
              <Link to="/record">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4 text-destructive" />
                  Record New Video
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Performers
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created on</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(performance.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last updated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(performance.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Rehearsals</p>
                <p className="text-sm text-muted-foreground">
                  {relatedRehearsals.length} total
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/performances/${performanceId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Performance
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
