import { User } from "../contexts/types";

export interface Performance {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  taggedUsers?: string[];
}

export interface Rehearsal {
  id: string;
  performanceId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  taggedUsers?: string[];
  notes?: string;
}

export interface Recording {
  id: string;
  rehearsalId: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  createdAt: string;
  taggedUsers?: string[];
  notes?: string;
  tags?: string[];
  blob?: Blob;
  isUploading?: boolean;
  uploadProgress?: number;
}

// Mock data for performances
export const mockPerformances: Performance[] = [
  {
    id: "1",
    title: "The Nutcracker",
    description: "Annual holiday performance of the classic ballet",
    coverImage: "https://images.unsplash.com/photo-1545059454-2a5f710da4b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    startDate: "2023-12-15",
    endDate: "2023-12-30",
    createdAt: "2023-09-01T12:00:00Z",
    updatedAt: "2023-09-01T12:00:00Z",
    createdBy: "1", // Jane Doe
    taggedUsers: ["1", "2"]
  },
  {
    id: "2",
    title: "Swan Lake",
    description: "Spring performance featuring guest choreographer",
    coverImage: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    startDate: "2024-04-10",
    endDate: "2024-04-20",
    createdAt: "2023-10-15T12:00:00Z",
    updatedAt: "2023-10-15T12:00:00Z",
    createdBy: "1", // Jane Doe
    taggedUsers: ["1"]
  },
];

// Mock data for rehearsals
export const mockRehearsals: Rehearsal[] = [
  {
    id: "1",
    performanceId: "1", // The Nutcracker
    title: "First Rehearsal - Opening Scene",
    description: "Focus on the opening party scene choreography",
    date: "2023-10-05",
    location: "Studio A",
    createdAt: "2023-09-02T14:30:00Z",
    updatedAt: "2023-09-02T14:30:00Z",
    taggedUsers: ["1", "2"],
    notes: "Remember to bring your character shoes"
  },
  {
    id: "2",
    performanceId: "1", // The Nutcracker
    title: "Second Rehearsal - Battle Scene",
    description: "Working on the mouse king battle",
    date: "2023-10-12",
    location: "Studio B",
    createdAt: "2023-09-05T15:45:00Z",
    updatedAt: "2023-09-05T15:45:00Z",
    taggedUsers: ["1", "2"],
    notes: "Extra props will be available"
  },
  {
    id: "3",
    performanceId: "2", // Swan Lake
    title: "Initial Staging - Act I",
    description: "Blocking for the opening act",
    date: "2023-11-03",
    location: "Main Stage",
    createdAt: "2023-10-20T10:15:00Z",
    updatedAt: "2023-10-20T10:15:00Z",
    taggedUsers: ["1"],
    notes: "Full company required"
  },
];

// Mock data for recordings
export const mockRecordings: Recording[] = [
  {
    id: "1",
    rehearsalId: "1", // First Rehearsal - Opening Scene
    title: "Opening Scene Run-through",
    thumbnailUrl: "https://images.unsplash.com/photo-1519925610903-381054cc2a1c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    duration: 315, // 5:15 in seconds
    createdAt: "2023-10-05T15:30:00Z",
    taggedUsers: ["1", "2"],
    notes: "Great energy! Fix timing at 2:30",
    tags: ["full run", "opening", "party scene"]
  },
  {
    id: "2",
    rehearsalId: "1", // First Rehearsal - Opening Scene
    title: "Party Scene - Clara's Solo",
    thumbnailUrl: "https://images.unsplash.com/photo-1560260240-c6ef90a163a4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    duration: 128, // 2:08 in seconds
    createdAt: "2023-10-05T16:15:00Z",
    taggedUsers: ["2"],
    notes: "Watch arm positions during turns",
    tags: ["solo", "clara", "party scene"]
  },
  {
    id: "3",
    rehearsalId: "2", // Second Rehearsal - Battle Scene
    title: "Mouse King Battle - First Run",
    thumbnailUrl: "https://images.unsplash.com/photo-1578269174936-2709b6aeb913?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    duration: 246, // 4:06 in seconds
    createdAt: "2023-10-12T14:45:00Z",
    taggedUsers: ["1", "2"],
    notes: "Need to tighten formation changes",
    tags: ["battle", "group", "needs work"]
  },
];
