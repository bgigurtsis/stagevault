
import { Recording } from "@/types";
import { dataService } from "./dataService";

// Define data types for creating and updating recordings
export interface CreateRecordingData {
  rehearsalId: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  notes?: string;
  tags?: string[];
  googleFileId?: string;
}

export interface UpdateRecordingData {
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  notes?: string;
  tags?: string[];
  googleFileId?: string;
}

const getRecentRecordings = async (limit: number = 3): Promise<Recording[]> => {
  try {
    const response = await dataService.get(`/recordings?_sort=createdAt:DESC&_limit=${limit}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching recent recordings:", error);
    return [];
  }
};

const getRecordingById = async (id: string): Promise<Recording | null> => {
  try {
    const response = await dataService.get(`/recordings/${id}`);
    return response || null;
  } catch (error) {
    console.error(`Error fetching recording with ID ${id}:`, error);
    return null;
  }
};

// Add the missing getRecordingsByRehearsalId function
const getRecordingsByRehearsalId = async (rehearsalId: string): Promise<Recording[]> => {
  try {
    const response = await dataService.get(`/recordings?rehearsalId=${rehearsalId}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error(`Error fetching recordings for rehearsal ${rehearsalId}:`, error);
    return [];
  }
};

const createRecording = async (recording: CreateRecordingData): Promise<Recording | null> => {
  try {
    const response = await dataService.post('/recordings', recording);
    return response || null;
  } catch (error) {
    console.error('Error creating recording:', error);
    return null;
  }
};

const updateRecording = async (id: string, recording: UpdateRecordingData): Promise<Recording | null> => {
  try {
    const response = await dataService.put(`/recordings/${id}`, recording);
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

const getAllRecordings = async (): Promise<Recording[]> => {
  try {
    const response = await dataService.get('/recordings');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching all recordings:', error);
    return [];
  }
};

export const recordingService = {
  getRecentRecordings,
  getRecordingById,
  createRecording,
  updateRecording,
  deleteRecording,
  getAllRecordings,
  getRecordingsByRehearsalId
};
