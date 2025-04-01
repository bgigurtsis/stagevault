
import { Performance } from "@/types";
import { dataService } from "./dataService";
import { googleDriveService } from "./googleDriveService";

export interface CreatePerformanceData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: "upcoming" | "active" | "completed" | "canceled";
  venue?: string;
  coverImage?: string;
  userId: string;
  taggedUsers?: string[];
  createdBy?: string;
}

export interface UpdatePerformanceData {
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: "upcoming" | "active" | "completed" | "canceled";
  venue?: string;
  coverImage?: string;
  taggedUsers?: string[];
}

// Mock data helpers
const transformPerformanceData = (data: any): Performance => {
  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    startDate: data.start_date,
    endDate: data.end_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    status: data.status || "upcoming",  // Add default status if missing
    venue: data.venue || "",
    coverImage: data.cover_image,
    userId: data.created_by || "",
    createdBy: data.created_by,
    taggedUsers: data.tagged_users || [],
    driveFolderId: data.drive_folder_id
  };
};

// Service methods
const getPerformances = async (): Promise<Performance[]> => {
  try {
    const response = await dataService.get("/performances");
    return Array.isArray(response) 
      ? response.map(transformPerformanceData) 
      : [];
  } catch (error) {
    console.error("Error fetching performances:", error);
    return [];
  }
};

const getPerformanceById = async (id: string): Promise<Performance | null> => {
  try {
    const response = await dataService.get(`/performances/${id}`);
    
    if (!response) return null;
    
    console.log("Performance data retrieved:", response);
    
    return transformPerformanceData(response);
  } catch (error) {
    console.error(`Error fetching performance with ID ${id}:`, error);
    return null;
  }
};

const createPerformance = async (performanceData: CreatePerformanceData): Promise<Performance | null> => {
  try {
    // Convert to DB format with snake_case
    const dbData = {
      title: performanceData.title,
      description: performanceData.description,
      start_date: performanceData.startDate,
      end_date: performanceData.endDate,
      status: performanceData.status || "upcoming",
      venue: performanceData.venue,
      cover_image: performanceData.coverImage,
      created_by: performanceData.userId || performanceData.createdBy,
      tagged_users: performanceData.taggedUsers || []
    };
    
    console.log("Creating performance with data:", dbData);
    
    const response = await dataService.post("/performances", dbData);
    
    if (!response) {
      throw new Error("No response from server when creating performance");
    }
    
    console.log("Created performance:", response);
    
    // Create Google Drive folder for the performance
    if (response && typeof response === 'object' && 'id' in response) {
      try {
        const folderResponse = await googleDriveService.createPerformanceFolder(response.title as string);
        if (folderResponse && typeof folderResponse === 'object' && 'id' in folderResponse) {
          // Update performance with the folder ID
          const updateResponse = await dataService.put(`/performances/${response.id as string}`, {
            drive_folder_id: folderResponse.id
          });
          console.log("Updated performance with Drive folder ID:", updateResponse);
          
          // If successful update, update our response object
          if (updateResponse && typeof updateResponse === 'object') {
            (response as any).drive_folder_id = folderResponse.id;
          }
        }
      } catch (driveError) {
        console.error("Error creating Google Drive folder:", driveError);
        // Continue even if folder creation fails
      }
    }
    
    return transformPerformanceData(response as any);
  } catch (error) {
    console.error("Error creating performance:", error);
    return null;
  }
};

const updatePerformance = async (performanceData: UpdatePerformanceData): Promise<Performance | null> => {
  try {
    if (!performanceData.id) {
      throw new Error("Performance ID is required for updates");
    }
    
    // Convert to DB format with snake_case
    const dbData: any = {};
    
    if (performanceData.title !== undefined) dbData.title = performanceData.title;
    if (performanceData.description !== undefined) dbData.description = performanceData.description;
    if (performanceData.startDate !== undefined) dbData.start_date = performanceData.startDate;
    if (performanceData.endDate !== undefined) dbData.end_date = performanceData.endDate;
    if (performanceData.status !== undefined) dbData.status = performanceData.status;
    if (performanceData.venue !== undefined) dbData.venue = performanceData.venue;
    if (performanceData.coverImage !== undefined) dbData.cover_image = performanceData.coverImage;
    if (performanceData.taggedUsers !== undefined) dbData.tagged_users = performanceData.taggedUsers;
    
    console.log(`Updating performance ${performanceData.id} with data:`, dbData);
    
    const response = await dataService.put(`/performances/${performanceData.id}`, dbData);
    
    return response ? transformPerformanceData(response) : null;
  } catch (error) {
    console.error(`Error updating performance with ID ${performanceData.id}:`, error);
    return null;
  }
};

const deletePerformance = async (id: string): Promise<boolean> => {
  try {
    // First try to get the performance to check if it has a Drive folder
    const performance = await getPerformanceById(id);
    
    // Delete from the database first
    await dataService.delete(`/performances/${id}`);
    
    // Then try to delete the associated Google Drive folder if it exists
    if (performance && performance.driveFolderId) {
      try {
        await googleDriveService.deleteFolder(performance.driveFolderId);
        console.log(`Deleted Google Drive folder ${performance.driveFolderId} for performance ${id}`);
      } catch (driveError) {
        console.error(`Error deleting Google Drive folder for performance ${id}:`, driveError);
        // Continue even if folder deletion fails
      }
    }
    
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
