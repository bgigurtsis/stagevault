
import { supabase } from "@/integrations/supabase/client";
import { Rehearsal } from "@/types";
import { googleDriveService } from "./googleDriveService";
import { performanceService } from "./performanceService";

export interface CreateRehearsalData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  notes?: string;
  performanceId: string;
  taggedUsers?: string[];
}

export interface UpdateRehearsalData extends Partial<CreateRehearsalData> {
  id: string;
}

class RehearsalService {
  /**
   * Get all rehearsals
   */
  async getAllRehearsals(): Promise<Rehearsal[]> {
    try {
      console.log("Fetching all rehearsals");
      const { data, error } = await supabase
        .from("rehearsals")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching rehearsals:", error);
        throw error;
      }

      console.log("Fetched rehearsals:", data);
      return data.map(item => ({
        id: item.id,
        performanceId: item.performance_id,
        title: item.title,
        description: item.description || undefined,
        date: item.date,
        location: item.location || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        taggedUsers: item.tagged_users || [],
        notes: item.notes || undefined,
        driveFolderId: item.drive_folder_id || undefined
      }));
    } catch (error) {
      console.error("Error in getAllRehearsals:", error);
      throw error;
    }
  }

  /**
   * Get rehearsals for a specific performance
   */
  async getRehearsalsByPerformance(performanceId: string): Promise<Rehearsal[]> {
    try {
      console.log(`Fetching rehearsals for performance: ${performanceId}`);
      const { data, error } = await supabase
        .from("rehearsals")
        .select("*")
        .eq("performance_id", performanceId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching rehearsals by performance:", error);
        throw error;
      }

      console.log("Fetched rehearsals for performance:", data);
      return data.map(item => ({
        id: item.id,
        performanceId: item.performance_id,
        title: item.title,
        description: item.description || undefined,
        date: item.date,
        location: item.location || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        taggedUsers: item.tagged_users || [],
        notes: item.notes || undefined,
        driveFolderId: item.drive_folder_id || undefined
      }));
    } catch (error) {
      console.error("Error in getRehearsalsByPerformance:", error);
      throw error;
    }
  }

  /**
   * Get a rehearsal by ID
   */
  async getRehearsalById(rehearsalId: string): Promise<Rehearsal> {
    try {
      console.log(`Fetching rehearsal with ID: ${rehearsalId}`);
      const { data, error } = await supabase
        .from("rehearsals")
        .select("*")
        .eq("id", rehearsalId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching rehearsal by ID:", error);
        throw error;
      }

      if (!data) {
        throw new Error(`Rehearsal with ID ${rehearsalId} not found`);
      }

      console.log("Fetched rehearsal:", data);
      return {
        id: data.id,
        performanceId: data.performance_id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        location: data.location || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        taggedUsers: data.tagged_users || [],
        notes: data.notes || undefined,
        driveFolderId: data.drive_folder_id || undefined
      };
    } catch (error) {
      console.error("Error in getRehearsalById:", error);
      throw error;
    }
  }

  /**
   * Create a new rehearsal
   */
  async createRehearsal(rehearsal: CreateRehearsalData): Promise<Rehearsal> {
    try {
      console.log("Creating new rehearsal:", rehearsal);
      
      // Get the performance to get its title and folder ID
      const performance = await performanceService.getPerformanceById(rehearsal.performanceId);
      if (!performance) {
        throw new Error(`Performance with ID ${rehearsal.performanceId} not found`);
      }
      
      // Create folder in Google Drive
      let driveFolderId: string | null = null;
      
      try {
        console.log(`Creating rehearsal folder in Google Drive for performance: ${performance.title}`);
        
        // If the performance has a folder ID, create the rehearsal folder as a child
        if (performance.driveFolderId) {
          driveFolderId = await googleDriveService.createRehearsalFolder(
            rehearsal.title, 
            performance.title,
            performance.driveFolderId
          );
        } else {
          // Create the rehearsal folder directly in the performance folder
          driveFolderId = await googleDriveService.createRehearsalFolderWithPerformance(
            rehearsal.title,
            performance.title
          );
        }
        
        if (driveFolderId) {
          console.log(`Successfully created rehearsal folder with ID: ${driveFolderId}`);
        } else {
          console.warn("Could not create Google Drive folder for rehearsal. Will continue without folder ID.");
        }
      } catch (driveError) {
        console.error("Error creating Google Drive folder for rehearsal:", driveError);
        // Continue with DB insert even if folder creation fails
      }
      
      const { data, error } = await supabase
        .from("rehearsals")
        .insert([{
          title: rehearsal.title,
          description: rehearsal.description,
          date: rehearsal.date,
          location: rehearsal.location,
          notes: rehearsal.notes,
          performance_id: rehearsal.performanceId,
          tagged_users: rehearsal.taggedUsers || [],
          drive_folder_id: driveFolderId
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating rehearsal:", error);
        throw error;
      }

      console.log("Created rehearsal:", data);
      return {
        id: data.id,
        performanceId: data.performance_id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        location: data.location || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        taggedUsers: data.tagged_users || [],
        notes: data.notes || undefined,
        driveFolderId: data.drive_folder_id || undefined
      };
    } catch (error) {
      console.error("Error in createRehearsal:", error);
      throw error;
    }
  }

  /**
   * Update a rehearsal
   */
  async updateRehearsal(rehearsalId: string, updates: Partial<CreateRehearsalData>): Promise<Rehearsal> {
    try {
      console.log(`Updating rehearsal ${rehearsalId}:`, updates);
      
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.performanceId !== undefined) updateData.performance_id = updates.performanceId;
      if (updates.taggedUsers !== undefined) updateData.tagged_users = updates.taggedUsers;
      
      const { data, error } = await supabase
        .from("rehearsals")
        .update(updateData)
        .eq("id", rehearsalId)
        .select()
        .single();

      if (error) {
        console.error("Error updating rehearsal:", error);
        throw error;
      }

      console.log("Updated rehearsal:", data);
      return {
        id: data.id,
        performanceId: data.performance_id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        location: data.location || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        taggedUsers: data.tagged_users || [],
        notes: data.notes || undefined,
        driveFolderId: data.drive_folder_id || undefined
      };
    } catch (error) {
      console.error("Error in updateRehearsal:", error);
      throw error;
    }
  }

  /**
   * Delete a rehearsal
   */
  async deleteRehearsal(rehearsalId: string): Promise<boolean> {
    try {
      console.log(`Deleting rehearsal with ID: ${rehearsalId}`);
      
      // Get the rehearsal to retrieve the Drive folder ID
      try {
        const rehearsal = await this.getRehearsalById(rehearsalId);
        
        // Delete the Google Drive folder if it exists
        if (rehearsal.driveFolderId) {
          try {
            console.log(`Attempting to delete Google Drive folder with ID: ${rehearsal.driveFolderId}`);
            const folderDeleted = await googleDriveService.deleteFolder(rehearsal.driveFolderId);
            
            if (folderDeleted) {
              console.log(`Successfully deleted Google Drive folder for rehearsal: ${rehearsalId}`);
            } else {
              console.warn(`Failed to delete Google Drive folder for rehearsal: ${rehearsalId}`);
            }
          } catch (driveError) {
            console.error(`Error deleting Google Drive folder for rehearsal ${rehearsalId}:`, driveError);
            // Continue with database deletion even if folder deletion fails
          }
        }
      } catch (rehearsalError) {
        console.error(`Error retrieving rehearsal ${rehearsalId} for deletion:`, rehearsalError);
        // Continue with deletion even if retrieval fails
      }
      
      const { error } = await supabase
        .from("rehearsals")
        .delete()
        .eq("id", rehearsalId);

      if (error) {
        console.error("Error deleting rehearsal:", error);
        throw error;
      }

      console.log("Rehearsal deleted successfully");
      return true;
    } catch (error) {
      console.error("Error in deleteRehearsal:", error);
      throw error;
    }
  }
}

export const rehearsalService = new RehearsalService();
