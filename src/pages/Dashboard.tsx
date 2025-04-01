import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { rehearsalService } from "@/services/rehearsalService";
import { Rehearsal } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRehearsals = async () => {
      try {
        setLoading(true);
        const rehearsalsData = await rehearsalService.getRehearsals();
        setRehearsals(rehearsalsData);
      } catch (error) {
        console.error("Error fetching rehearsals:", error);
        toast({
          title: "Error",
          description: "Failed to load rehearsals. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRehearsals();
  }, [toast]);

  const filteredRehearsals = date
    ? rehearsals.filter((rehearsal) => {
        const rehearsalDate = new Date(rehearsal.date);
        const selectedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        return (
          rehearsalDate.getFullYear() === selectedDate.getFullYear() &&
          rehearsalDate.getMonth() === selectedDate.getMonth() &&
          rehearsalDate.getDate() === selectedDate.getDate()
        );
      })
    : rehearsals;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="h-auto px-4 py-2 text-sm font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-3/4" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-1/2" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRehearsals.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredRehearsals.map((rehearsal) => (
            <Card
              key={rehearsal.id}
              className="cursor-pointer hover:opacity-75 transition-opacity duration-200"
              onClick={() => navigate(`/rehearsals/${rehearsal.id}`)}
            >
              <CardHeader>
                <CardTitle>{rehearsal.title}</CardTitle>
                <CardDescription>
                  {format(new Date(rehearsal.date), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rehearsal.notes && <p className="text-sm text-muted-foreground">{rehearsal.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-semibold">No Rehearsals Scheduled</h2>
          <p className="text-muted-foreground">
            There are no rehearsals scheduled for the selected date.
          </p>
          <Button onClick={() => navigate("/rehearsals")} className="mt-4">
            View All Rehearsals
          </Button>
        </div>
      )}
    </div>
  );
}
