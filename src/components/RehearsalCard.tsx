
import { Link } from "react-router-dom";
import { Calendar, PlayCircle, Plus, MapPin } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rehearsal } from "@/types";
import { User } from "@/contexts/types";

interface RehearsalCardProps {
  rehearsal?: Rehearsal;
  performanceId: string;
  onViewAllClick: () => void;
  getUserById: (userId: string) => User | null;
  rehearsalsCount: number;
}

export default function RehearsalCard({
  rehearsal,
  performanceId,
  onViewAllClick,
  getUserById,
  rehearsalsCount
}: RehearsalCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">
          {rehearsal ? 'Latest Rehearsal' : 'Rehearsals'}
        </h2>
        {rehearsalsCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAllClick}
          >
            View All {rehearsalsCount > 1 ? `(${rehearsalsCount})` : ''}
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {rehearsal ? (
          <Link 
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
          </Link>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto bg-muted h-16 w-16 rounded-full flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-medium">No rehearsals yet</h3>
              <p className="text-muted-foreground">Schedule your first rehearsal for this performance</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant={rehearsal ? "default" : "default"}
          className="w-full"
          onClick={() => window.location.href = `/rehearsals/new?performanceId=${performanceId}`}
        >
          <Plus className="mr-2 h-4 w-4" />
          {rehearsal ? "Add Another Rehearsal" : "Create First Rehearsal"}
        </Button>
      </CardFooter>
    </Card>
  );
}
