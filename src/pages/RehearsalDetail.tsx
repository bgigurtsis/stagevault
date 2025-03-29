
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Users, Edit, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSwipeGesture from "@/components/MobileSwipeGesture";

interface Recording {
  id: string;
  title: string;
  duration: number; // in seconds
  thumbnail: string;
  createdAt: Date;
}

// This would normally come from an API call
const getMockRehearsalData = (id: string) => {
  return {
    id,
    title: "Dress Rehearsal",
    description: "Final preparation before the show with full costumes and staging.",
    date: new Date(2023, 5, 20),
    performanceTitle: "Nutcracker",
    performanceId: "p1",
    participants: ["Anna Smith", "John Doe", "Sarah Williams", "Michael Brown"],
    recordings: [
      {
        id: "r1",
        title: "Opening Scene",
        duration: 180, // 3 minutes
        thumbnail: "https://placehold.co/600x400/stage-purple/white?text=Recording+1",
        createdAt: new Date(2023, 5, 20, 14, 0)
      },
      {
        id: "r2",
        title: "Act I Scene 2",
        duration: 240, // 4 minutes
        thumbnail: "https://placehold.co/600x400/stage-deep-purple/white?text=Recording+2",
        createdAt: new Date(2023, 5, 20, 14, 15)
      },
      {
        id: "r3",
        title: "Act II Scene 1",
        duration: 300, // 5 minutes
        thumbnail: "https://placehold.co/600x400/stage-purple/white?text=Recording+3",
        createdAt: new Date(2023, 5, 20, 14, 30)
      }
    ]
  };
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function RehearsalDetail() {
  const { rehearsalId } = useParams<{ rehearsalId: string }>();
  const isMobile = useIsMobile();
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0);
  
  // In a real app, you would fetch this data from an API
  const rehearsal = getMockRehearsalData(rehearsalId || "");
  
  const goToNextRecording = () => {
    if (rehearsal.recordings.length > currentRecordingIndex + 1) {
      setCurrentRecordingIndex(prev => prev + 1);
    }
  };
  
  const goToPrevRecording = () => {
    if (currentRecordingIndex > 0) {
      setCurrentRecordingIndex(prev => prev - 1);
    }
  };
  
  const Recording = ({ recording }: { recording: Recording }) => (
    <Card className="h-full overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <img 
          src={recording.thumbnail} 
          alt={recording.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {formatDuration(recording.duration)}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-2">{recording.title}</h3>
        <p className="text-sm text-muted-foreground">
          Recorded at {format(recording.createdAt, "h:mm a")}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <MobileSwipeGesture
      onSwipeLeft={goToNextRecording}
      onSwipeRight={goToPrevRecording}
      className="container mx-auto px-4 py-6 max-w-5xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center">
            <Link to="/rehearsals">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{rehearsal.title}</h1>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size={isMobile ? "sm" : "default"}>
              <Edit className="h-4 w-4 mr-1" />
              {isMobile ? "" : "Edit"}
            </Button>
            <Link to="/record">
              <Button size={isMobile ? "sm" : "default"}>
                <Video className="h-4 w-4 mr-1" />
                {isMobile ? "" : "Record"}
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-muted/20 p-4 rounded-lg">
              <p>{rehearsal.description}</p>
            </div>
            
            {/* Mobile-optimized recording carousel */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recordings</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={goToPrevRecording}
                    disabled={currentRecordingIndex === 0}
                    className="h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentRecordingIndex + 1} / {rehearsal.recordings.length}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={goToNextRecording}
                    disabled={currentRecordingIndex === rehearsal.recordings.length - 1}
                    className="h-8 w-8 md:h-10 md:w-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {isMobile ? (
                <div className="md:hidden">
                  <Recording recording={rehearsal.recordings[currentRecordingIndex]} />
                </div>
              ) : (
                <div className="hidden md:grid md:grid-cols-2 gap-4">
                  {rehearsal.recordings.map(recording => (
                    <Recording key={recording.id} recording={recording} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-muted/10 p-4 rounded-lg space-y-4 border">
              <h2 className="text-lg font-semibold">Details</h2>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(rehearsal.date, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(rehearsal.recordings.reduce((total, r) => total + r.duration, 0))}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {rehearsal.participants.map(participant => (
                      <span 
                        key={participant} 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <Link to={`/performances/${rehearsal.performanceId}`} className="block">
                <h3 className="font-medium">Performance</h3>
                <p className="text-primary underline-offset-4 hover:underline">
                  {rehearsal.performanceTitle}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MobileSwipeGesture>
  );
}
