
import { BaseService } from "./baseService";
import { Performance, PerformanceStatus } from "@/types";
import { googleDriveService } from "./googleDriveService";

export interface CreatePerformanceData {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  taggedUsers?: string[];
  createdBy: string;
  status?: PerformanceStatus;
  userId: string;
}

export interface UpdatePerformanceData extends Partial<CreatePerformanceData> {
  id: string;
}

export class PerformanceService extends BaseService {
  async getPerformances(): Promise<Performance[]> {
    const { data, error } = await this.supabase
      .from("performances")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching performances:", error);
      return [];
    }
    
    return data.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || undefined,
      startDate: p.start_date || undefined,
      endDate: p.end_date || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p.created_by,
      taggedUsers: p.tagged_users || [],
      driveFolderId: p.drive_folder_id || undefined,
      status: (p.status as PerformanceStatus) || "upcoming",
      userId: p.created_by, // Using created_by as userId for compatibility
      coverImage: p.cover_image
    }));
  }
  
  async getPerformanceById(id: string): Promise<Performance | null> {
    console.log(`Fetching performance with ID: ${id}`);
    
    const { data, error } = await this.supabase
      .from("performances")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching performance:", error);
      return null;
    }
    
    if (!data) {
      console.error("No performance found with ID:", id);
      return null;
    }
    
    console.log("Performance data retrieved:", data);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      taggedUsers: data.tagged_users || [],
      driveFolderId: data.drive_folder_id || undefined,
      status: (data.status as PerformanceStatus) || "upcoming",
      userId: data.created_by, // Using created_by as userId for compatibility
      coverImage: data.cover_image
    };
  }
  
  async createPerformance(performanceData: CreatePerformanceData): Promise<Performance | null> {
    console.log("Creating performance with data:", performanceData);
    
    try {
      // Create folder in Google Drive
      let driveFolderId: string | null = null;
      
      try {
        console.log("Creating performance folder in Google Drive for:", performanceData.title);
        driveFolderId = await googleDriveService.createPerformanceFolder(performanceData.title);
        
        if (driveFolderId) {
          console.log(`Successfully created performance folder with ID: ${driveFolderId}`);
        } else {
          console.warn("Could not create Google Drive folder for performance. Will continue without folder ID.");
        }
      } catch (driveError) {
        console.error("Error creating Google Drive folder for performance:", driveError);
        // Continue with DB insert even if folder creation fails
      }

      // Insert performance into the database
      const { data, error } = await this.supabase
        .from("performances")
        .insert({
          title: performanceData.title,
          description: performanceData.description,
          start_date: performanceData.startDate,
          end_date: performanceData.endDate,
          tagged_users: performanceData.taggedUsers,
          created_by: performanceData.createdBy,
          drive_folder_id: driveFolderId,
          status: performanceData.status || "upcoming",
          user_id: performanceData.userId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating performance:", error);
        return null;
      }
      
      console.log("Performance created successfully:", data);
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        taggedUsers: data.tagged_users || [],
        driveFolderId: data.drive_folder_id || undefined,
        status: (data.status as PerformanceStatus) || "upcoming",
        userId: data.created_by, // Using created_by as userId for compatibility
        coverImage: data.cover_image
      };
    } catch (error) {
      console.error("Unexpected error during performance creation:", error);
      return null;
    }
  }
  
  async updatePerformance(performanceData: UpdatePerformanceData): Promise<Performance | null> {
    const updateData: any = {};
    
    if (performanceData.title !== undefined) updateData.title = performanceData.title;
    if (performanceData.description !== undefined) updateData.description = performanceData.description;
    if (performanceData.startDate !== undefined) updateData.start_date = performanceData.startDate;
    if (performanceData.endDate !== undefined) updateData.end_date = performanceData.endDate;
    if (performanceData.taggedUsers !== undefined) updateData.tagged_users = performanceData.taggedUsers;
    if (performanceData.status !== undefined) updateData.status = performanceData.status;
    if (performanceData.userId !== undefined) updateData.user_id = performanceData.userId;
    
    const { data, error } = await this.supabase
      .from("performances")
      .update(updateData)
      .eq("id", performanceData.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating performance:", error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      taggedUsers: data.tagged_users || [],
      driveFolderId: data.drive_folder_id || undefined,
      status: (data.status as PerformanceStatus) || "upcoming",
      userId: data.created_by, // Using created_by as userId for compatibility
      coverImage: data.cover_image
    };
  }
  
  async deletePerformance(id: string): Promise<boolean> {
    try {
      console.log(`Starting deletion process for performance with ID: ${id}`);
      
      // First, get the performance to retrieve the Drive folder ID
      const performance = await this.getPerformanceById(id);
      
      // Prepare for database deletion regardless of Drive folder success
      const deleteDatabaseRecord = async () => {
        console.log(`Deleting performance from database, ID: ${id}`);
        const { error } = await this.supabase
          .from("performances")
          .delete()
          .eq("id", id);
        
        if (error) {
          console.error("Error deleting performance from database:", error);
          throw new Error(`Database deletion failed: ${error.message}`);
        }
        
        console.log(`Successfully deleted performance ${id} from database`);
        return true;
      };
      
      // If there's no Drive folder or no performance found, just delete from database
      if (!performance || !performance.driveFolderId) {
        console.log(`No Drive folder found for performance ${id}, proceeding with database deletion only`);
        return await deleteDatabaseRecord();
      }
      
      // Try to delete the Google Drive folder, but continue with DB deletion even if it fails
      try {
        console.log(`Attempting to delete Google Drive folder with ID: ${performance.driveFolderId}`);
        const folderDeleted = await googleDriveService.deleteFolder(performance.driveFolderId);
        
        if (folderDeleted) {
          console.log(`Successfully deleted Google Drive folder for performance: ${id}`);
        } else {
          console.warn(`Failed to delete Google Drive folder for performance: ${id}, but will continue with database deletion`);
        }
      } catch (driveError) {
        // Log the error but don't throw - we still want to delete the database record
        console.error(`Error deleting Google Drive folder for performance ${id}:`, driveError);
        console.log(`Continuing with database deletion despite Drive folder deletion failure`);
      }
      
      // Proceed with database deletion
      return await deleteDatabaseRecord();
    } catch (error) {
      console.error("Unexpected error during performance deletion:", error);
      throw error; // Re-throw to allow caller to handle it
    }
  }
}

export const performanceService = new PerformanceService();
