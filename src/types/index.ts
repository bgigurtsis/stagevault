
// Let's update the Performance and Recording types to match what's being used
export type PerformanceStatus = "upcoming" | "active" | "completed" | "canceled";

export interface Performance {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  status: PerformanceStatus;
  venue?: string;
  coverImage?: string | null;
  userId: string;
  taggedUsers?: string[];
  createdBy?: string;
  driveFolderId?: string | null;
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
  driveFolderId?: string;
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
  googleFileId?: string;
}

// Empty mock data for performances
export const mockPerformances: Performance[] = [];

// Empty mock data for rehearsals
export const mockRehearsals: Rehearsal[] = [];

// Empty mock data for recordings
export const mockRecordings: Recording[] = [];
