
import { BaseService } from "./baseService";
import { Rehearsal } from "@/types";
import { googleDriveService } from "./googleDriveService";

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

export class RehearsalService extends BaseService {
  async getRehearsals(): Promise<Rehearsal[]> {
    const { data, error } = await this.supabase
      .from("rehearsals")
      .select("*")
      .order("date", { ascending: false });
    
    if (error) {
      console.error("Error fetching rehearsals:", error);
      return [];
    }
    
    return data.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      date: r.date,
      location: r.location || undefined,
      notes: r.notes || undefined,
      performanceId: r.performance_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      taggedUsers: r.tagged_users || [],
      driveFolderId: r.drive_folder_id || undefined
    }));
  }
  
  async getRehearsalById(id: string): Promise<Rehearsal | null> {
    const { data, error } = await this.supabase
      .from("rehearsals")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching rehearsal:", error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      location: data.location || undefined,
      notes: data.notes || undefined,
      performanceId: data.performance_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      taggedUsers: data.tagged_users || [],
      driveFolderId: data.drive_folder_id || undefined
    };
  }
  
  async getRehearsalsByPerformance(performanceId: string): Promise<Rehearsal[]> {
    const { data, error } = await this.supabase
      .from("rehearsals")
      .select("*")
      .eq("performance_id", performanceId)
      .order("date", { ascending: false });
    
    if (error) {
      console.error("Error fetching rehearsals by performance:", error);
      return [];
    }
    
    return data.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || undefined,
      date: r.date,
      location: r.location || undefined,
      notes: r.notes || undefined,
      performanceId: r.performance_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      taggedUsers: r.tagged_users || [],
      driveFolderId: r.drive_folder_id || undefined
    }));
  }
  
  async createRehearsal(rehearsalData: CreateRehearsalData): Promise<Rehearsal | null> {
    try {
      // Create folder in Google Drive if performance has a drive folder
      let driveFolderId: string | null = null;
      
      if (rehearsalData.performanceId) {
        try {
          const { data: performance } = await this.supabase
            .from("performances")
            .select("drive_folder_id, title")
            .eq("id", rehearsalData.performanceId)
            .single();
          
          if (performance?.drive_folder_id) {
            driveFolderId = await googleDriveService.createRehearsalFolder(
              rehearsalData.title,
              performance.drive_folder_id,
              performance.title
            );
          }
        } catch (error) {
          console.error("Error creating Google Drive folder for rehearsal:", error);
          // Continue with DB insert even if folder creation fails
        }
      }
      
      // Insert rehearsal into database
      const { data, error } = await this.supabase
        .from("rehearsals")
        .insert({
          title: rehearsalData.title,
          description: rehearsalData.description,
          date: rehearsalData.date,
          location: rehearsalData.location,
          notes: rehearsalData.notes,
          performance_id: rehearsalData.performanceId,
          tagged_users: rehearsalData.taggedUsers,
          drive_folder_id: driveFolderId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating rehearsal:", error);
        return null;
      }
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        date: data.date,
        location: data.location || undefined,
        notes: data.notes || undefined,
        performanceId: data.performance_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        taggedUsers: data.tagged_users || [],
        driveFolderId: data.drive_folder_id || undefined
      };
    } catch (error) {
      console.error("Unexpected error during rehearsal creation:", error);
      return null;
    }
  }
  
  async updateRehearsal(rehearsalData: UpdateRehearsalData): Promise<Rehearsal | null> {
    const updateData: any = {};
    
    if (rehearsalData.title !== undefined) updateData.title = rehearsalData.title;
    if (rehearsalData.description !== undefined) updateData.description = rehearsalData.description;
    if (rehearsalData.date !== undefined) updateData.date = rehearsalData.date;
    if (rehearsalData.location !== undefined) updateData.location = rehearsalData.location;
    if (rehearsalData.notes !== undefined) updateData.notes = rehearsalData.notes;
    if (rehearsalData.performanceId !== undefined) updateData.performance_id = rehearsalData.performanceId;
    if (rehearsalData.taggedUsers !== undefined) updateData.tagged_users = rehearsalData.taggedUsers;
    
    const { data, error } = await this.supabase
      .from("rehearsals")
      .update(updateData)
      .eq("id", rehearsalData.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating rehearsal:", error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      location: data.location || undefined,
      notes: data.notes || undefined,
      performanceId: data.performance_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      taggedUsers: data.tagged_users || [],
      driveFolderId: data.drive_folder_id || undefined
    };
  }
  
  async deleteRehearsal(id: string): Promise<boolean> {
    // Get rehearsal to check for Drive folder
    const rehearsal = await this.getRehearsalById(id);
    
    if (rehearsal?.driveFolderId) {
      // Try to delete the Google Drive folder
      try {
        await googleDriveService.deleteFolder(rehearsal.driveFolderId);
      } catch (error) {
        console.error("Error deleting Google Drive folder for rehearsal:", error);
        // Continue with database deletion even if folder deletion fails
      }
    }
    
    const { error } = await this.supabase
      .from("rehearsals")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting rehearsal:", error);
      return false;
    }
    
    return true;
  }
}

export const rehearsalService = new RehearsalService();
