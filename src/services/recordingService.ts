
import { Recording } from "@/types";
import { dataService } from "../services/dataService";

export interface CreateRecordingData {
  rehearsalId: string;
  title: string;
  notes?: string;
  tags?: string[];
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  googleFileId?: string;
}

export interface UpdateRecordingData {
  id: string;
  title?: string;
  notes?: string;
  tags?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

const getRecentRecordings = async (limit: number = 5): Promise<Recording[]> => {
  try {
    const response = await dataService.get<Recording[]>(`/recordings?_sort=createdAt:DESC&_limit=${limit}`);
    return response || [];
  } catch (error) {
    console.error("Error fetching recent recordings:", error);
    return [];
  }
};

const getRecordingsByRehearsalId = async (rehearsalId: string): Promise<Recording[]> => {
  try {
    const response = await dataService.get<Recording[]>(`/recordings?rehearsalId=${rehearsalId}`);
    return response || [];
  } catch (error) {
    console.error(`Error fetching recordings for rehearsal ${rehearsalId}:`, error);
    return [];
  }
};

const getRecordingById = async (id: string): Promise<Recording | null> => {
  try {
    const response = await dataService.get<Recording>(`/recordings/${id}`);
    return response || null;
  } catch (error) {
    console.error(`Error fetching recording with ID ${id}:`, error);
    return null;
  }
};

const createRecording = async (recordingData: CreateRecordingData): Promise<Recording | null> => {
  try {
    const response = await dataService.post<Recording>('/recordings', recordingData);
    return response || null;
  } catch (error) {
    console.error('Error creating recording:', error);
    return null;
  }
};

const updateRecording = async (id: string, recordingData: UpdateRecordingData): Promise<Recording | null> => {
  try {
    const response = await dataService.put<Recording>(`/recordings/${id}`, recordingData);
    return response || null;
  } catch (error) {
    console.error(`Error updating recording with ID ${id}:`, error);
    return null;
  }
};

const deleteRecording = async (id: string): Promise<boolean> => {
  try {
    await dataService.delete(`/recordings/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting recording with ID ${id}:`, error);
    return false;
  }
};

export const recordingService = {
  getRecentRecordings,
  getRecordingById,
  createRecording,
  updateRecording,
  deleteRecording,
  getRecordingsByRehearsalId,

  getAllRecordings: async (): Promise<Recording[]> => {
    try {
      const response = await dataService.get<Recording[]>('/recordings');
      return response || [];
    } catch (error) {
      console.error('Error fetching all recordings:', error);
      return [];
    }
  },
};
