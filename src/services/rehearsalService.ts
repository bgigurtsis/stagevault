
import { supabase } from "@/integrations/supabase/client";
import { Rehearsal } from "@/types";

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
      return data || [];
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
        .eq("performanceId", performanceId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching rehearsals by performance:", error);
        throw error;
      }

      console.log("Fetched rehearsals for performance:", data);
      return data || [];
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
      return data;
    } catch (error) {
      console.error("Error in getRehearsalById:", error);
      throw error;
    }
  }

  /**
   * Create a new rehearsal
   */
  async createRehearsal(rehearsal: Omit<Rehearsal, "id" | "createdAt" | "updatedAt">): Promise<Rehearsal> {
    try {
      console.log("Creating new rehearsal:", rehearsal);
      const { data, error } = await supabase
        .from("rehearsals")
        .insert([rehearsal])
        .select()
        .single();

      if (error) {
        console.error("Error creating rehearsal:", error);
        throw error;
      }

      console.log("Created rehearsal:", data);
      return data;
    } catch (error) {
      console.error("Error in createRehearsal:", error);
      throw error;
    }
  }

  /**
   * Update a rehearsal
   */
  async updateRehearsal(rehearsalId: string, updates: Partial<Rehearsal>): Promise<Rehearsal> {
    try {
      console.log(`Updating rehearsal ${rehearsalId}:`, updates);
      const { data, error } = await supabase
        .from("rehearsals")
        .update(updates)
        .eq("id", rehearsalId)
        .select()
        .single();

      if (error) {
        console.error("Error updating rehearsal:", error);
        throw error;
      }

      console.log("Updated rehearsal:", data);
      return data;
    } catch (error) {
      console.error("Error in updateRehearsal:", error);
      throw error;
    }
  }

  /**
   * Delete a rehearsal
   */
  async deleteRehearsal(rehearsalId: string): Promise<void> {
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
    } catch (error) {
      console.error("Error in deleteRehearsal:", error);
      throw error;
    }
  }
}

export const rehearsalService = new RehearsalService();
