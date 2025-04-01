import { Recording } from "@/types";
import { dataService } from "@/utils/dataService";

const getRecentRecordings = async (limit: number): Promise<Recording[]> => {
  try {
    const response = await dataService.get<Recording[]>(`/recordings?_sort=createdAt:DESC&_limit=${limit}`);
    return response || [];
  } catch (error) {
    console.error("Error fetching recent recordings:", error);
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

const createRecording = async (recording: Recording): Promise<Recording | null> => {
  try {
    const response = await dataService.post<Recording>('/recordings', recording);
    return response || null;
  } catch (error) {
    console.error('Error creating recording:', error);
    return null;
  }
};

const updateRecording = async (id: string, recording: Recording): Promise<Recording | null> => {
  try {
    const response = await dataService.put<Recording>(`/recordings/${id}`, recording);
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
