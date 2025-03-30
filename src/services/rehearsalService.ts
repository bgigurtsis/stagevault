
import { BaseService } from "./baseService";
import { Rehearsal } from "@/types";

export interface CreateRehearsalData {
  performanceId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  notes?: string;
  taggedUsers?: string[];
}

export interface UpdateRehearsalData extends Partial<CreateRehearsalData> {
  id: string;
}

export class RehearsalService extends BaseService {
  async getRehearsalsByPerformanceId(performanceId: string): Promise<Rehearsal[]> {
    const { data, error } = await this.supabase
      .from("rehearsals")
      .select("*")
      .eq("performance_id", performanceId)
      .order("date", { ascending: false });
    
    if (error) {
      console.error("Error fetching rehearsals:", error);
      return [];
    }
    
    return data.map(r => ({
      id: r.id,
      performanceId: r.performance_id,
      title: r.title,
      description: r.description || undefined,
      date: r.date,
      location: r.location || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      taggedUsers: r.tagged_users || [],
      notes: r.notes || undefined
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
      performanceId: data.performance_id,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      location: data.location || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      taggedUsers: data.tagged_users || [],
      notes: data.notes || undefined
    };
  }
  
  async createRehearsal(rehearsalData: CreateRehearsalData): Promise<Rehearsal | null> {
    const { data, error } = await this.supabase
      .from("rehearsals")
      .insert({
        performance_id: rehearsalData.performanceId,
        title: rehearsalData.title,
        description: rehearsalData.description,
        date: rehearsalData.date,
        location: rehearsalData.location,
        notes: rehearsalData.notes,
        tagged_users: rehearsalData.taggedUsers
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating rehearsal:", error);
      return null;
    }
    
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
      notes: data.notes || undefined
    };
  }
  
  async updateRehearsal(rehearsalData: UpdateRehearsalData): Promise<Rehearsal | null> {
    const updateData: any = {};
    
    if (rehearsalData.title !== undefined) updateData.title = rehearsalData.title;
    if (rehearsalData.performanceId !== undefined) updateData.performance_id = rehearsalData.performanceId;
    if (rehearsalData.description !== undefined) updateData.description = rehearsalData.description;
    if (rehearsalData.date !== undefined) updateData.date = rehearsalData.date;
    if (rehearsalData.location !== undefined) updateData.location = rehearsalData.location;
    if (rehearsalData.notes !== undefined) updateData.notes = rehearsalData.notes;
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
      performanceId: data.performance_id,
      title: data.title,
      description: data.description || undefined,
      date: data.date,
      location: data.location || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      taggedUsers: data.tagged_users || [],
      notes: data.notes || undefined
    };
  }
  
  async deleteRehearsal(id: string): Promise<boolean> {
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
