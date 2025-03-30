
import { supabase } from "@/integrations/supabase/client";
import { Rehearsal } from "@/types";

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
        notes: item.notes || undefined
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
        notes: item.notes || undefined
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
        notes: data.notes || undefined
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
      const { data, error } = await supabase
        .from("rehearsals")
        .insert([{
          title: rehearsal.title,
          description: rehearsal.description,
          date: rehearsal.date,
          location: rehearsal.location,
          notes: rehearsal.notes,
          performance_id: rehearsal.performanceId,
          tagged_users: rehearsal.taggedUsers || []
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
        notes: data.notes || undefined
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
        notes: data.notes || undefined
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
