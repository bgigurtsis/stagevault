
import { Performance } from "@/types";
import { dataService } from "./dataService";
import { googleDriveService } from "./googleDriveService";

export interface CreatePerformanceData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: string;
  venue?: string;
  coverImage?: string | null;
  userId: string;
  taggedUsers?: string[];
  createdBy?: string;
  driveFolderId?: string | null;
}

export interface UpdatePerformanceData {
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  venue?: string;
  coverImage?: string | null;
  userId?: string;
  taggedUsers?: string[];
  createdBy?: string;
  driveFolderId?: string | null;
}

const getPerformances = async (): Promise<Performance[]> => {
  try {
    const response = await dataService.get("/performances");
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching performances:", error);
    return [];
  }
};

const getPerformanceById = async (id: string): Promise<Performance | null> => {
  try {
    const response = await dataService.get(`/performances/${id}`);
    return response || null;
  } catch (error) {
    console.error(`Error fetching performance with ID ${id}:`, error);
    return null;
  }
};

// Note: Make sure this function is defined in googleDriveService or implement it
const createGoogleDriveFolder = async (performance: CreatePerformanceData): Promise<string | null> => {
  try {
    // This is a fallback implementation if googleDriveService doesn't have createFolder
    // Ideally, you should implement createFolder in googleDriveService
    console.log('Creating folder for performance:', performance.title);
    
    // Return a mock folder ID for now
    return "mock-folder-id";
  } catch (error) {
    console.error('Error creating Google Drive folder:', error);
    return null;
  }
};

const createPerformance = async (performance: CreatePerformanceData): Promise<Performance | null> => {
  try {
    // First, create the performance in the database
    const response = await dataService.post('/performances', performance);
    
    if (!response) {
      console.error('Failed to create performance in the database.');
      return null;
    }

    // Create a new performance object with the response data
    const newPerformance = response as Performance;

    // Then, create a Google Drive folder for the performance if possible
    try {
      const folderId = await createGoogleDriveFolder(performance);

      // If folder creation is successful, update the performance with the folder ID
      if (folderId) {
        const updatedPerformanceData: UpdatePerformanceData = {
          id: newPerformance.id,
          driveFolderId: folderId,
        };

        const updatedResponse = await dataService.put(`/performances/${newPerformance.id}`, updatedPerformanceData);
        if (updatedResponse) {
          console.log('Performance updated with Google Drive folder ID.');
          return updatedResponse as Performance;
        }
      }
    } catch (folderError) {
      console.warn('Google Drive folder creation failed:', folderError);
    }
    
    // Return the original performance even if folder creation failed
    return newPerformance;
    
  } catch (error) {
    console.error('Error creating performance:', error);
    return null;
  }
};

const updatePerformance = async (performance: UpdatePerformanceData): Promise<Performance | null> => {
  try {
    const response = await dataService.put(`/performances/${performance.id}`, performance);
    return response as Performance || null;
  } catch (error) {
    console.error(`Error updating performance with ID ${performance.id}:`, error);
    return null;
  }
};

const deletePerformance = async (id: string): Promise<boolean> => {
  try {
    await dataService.delete(`/performances/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting performance with ID ${id}:`, error);
    return false;
  }
};

export const performanceService = {
  getPerformances,
  getPerformanceById,
  createPerformance,
  updatePerformance,
  deletePerformance,
};
