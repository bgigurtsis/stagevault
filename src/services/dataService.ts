
import { supabase } from "@/integrations/supabase/client";
import { Performance, Rehearsal, Recording } from "@/types";

// Type definitions for database operations
export interface CreatePerformanceData {
  title: string;
  description?: string;
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  taggedUsers?: string[];
  createdBy: string; // Added this required field
}

export interface UpdatePerformanceData extends Partial<CreatePerformanceData> {
  id: string;
}

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

export interface CreateRecordingData {
  rehearsalId: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  googleFileId?: string;
  notes?: string;
  tags?: string[];
  taggedUsers?: string[];
}

export interface UpdateRecordingData extends Partial<CreateRecordingData> {
  id: string;
}

class DataService {
  // Performance methods
  async getPerformances(): Promise<Performance[]> {
    const { data, error } = await supabase
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
      coverImage: p.cover_image || undefined,
      startDate: p.start_date || undefined,
      endDate: p.end_date || undefined,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p.created_by,
      taggedUsers: p.tagged_users || []
    }));
  }
  
  async getPerformanceById(id: string): Promise<Performance | null> {
    const { data, error } = await supabase
      .from("performances")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching performance:", error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      coverImage: data.cover_image || undefined,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      taggedUsers: data.tagged_users || []
    };
  }
  
  async createPerformance(performanceData: CreatePerformanceData): Promise<Performance | null> {
    const { data, error } = await supabase
      .from("performances")
      .insert({
        title: performanceData.title,
        description: performanceData.description,
        cover_image: performanceData.coverImage,
        start_date: performanceData.startDate,
        end_date: performanceData.endDate,
        tagged_users: performanceData.taggedUsers,
        created_by: performanceData.createdBy // Add the created_by field here
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating performance:", error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      coverImage: data.cover_image || undefined,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      taggedUsers: data.tagged_users || []
    };
  }
  
  async updatePerformance(performanceData: UpdatePerformanceData): Promise<Performance | null> {
    const updateData: any = {};
    
    if (performanceData.title !== undefined) updateData.title = performanceData.title;
    if (performanceData.description !== undefined) updateData.description = performanceData.description;
    if (performanceData.coverImage !== undefined) updateData.cover_image = performanceData.coverImage;
    if (performanceData.startDate !== undefined) updateData.start_date = performanceData.startDate;
    if (performanceData.endDate !== undefined) updateData.end_date = performanceData.endDate;
    if (performanceData.taggedUsers !== undefined) updateData.tagged_users = performanceData.taggedUsers;
    
    const { data, error } = await supabase
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
      coverImage: data.cover_image || undefined,
      startDate: data.start_date || undefined,
      endDate: data.end_date || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      taggedUsers: data.tagged_users || []
    };
  }
  
  async deletePerformance(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("performances")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting performance:", error);
      return false;
    }
    
    return true;
  }
  
  // Rehearsal methods
  async getRehearsalsByPerformanceId(performanceId: string): Promise<Rehearsal[]> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from("rehearsals")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting rehearsal:", error);
      return false;
    }
    
    return true;
  }
  
  // Recording methods
  async getRecordingsByRehearsalId(rehearsalId: string): Promise<Recording[]> {
    const { data, error } = await supabase
      .from("recordings")
      .select("*")
      .eq("rehearsal_id", rehearsalId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching recordings:", error);
      return [];
    }
    
    return data.map(r => ({
      id: r.id,
      rehearsalId: r.rehearsal_id,
      title: r.title,
      videoUrl: r.video_url || undefined,
      thumbnailUrl: r.thumbnail_url || undefined,
      duration: r.duration,
      createdAt: r.created_at,
      taggedUsers: r.tagged_users || [],
      notes: r.notes || undefined,
      tags: r.tags || []
    }));
  }
  
  async getRecordingById(id: string): Promise<Recording | null> {
    const { data, error } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching recording:", error);
      return null;
    }
    
    return {
      id: data.id,
      rehearsalId: data.rehearsal_id,
      title: data.title,
      videoUrl: data.video_url || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
      duration: data.duration,
      createdAt: data.created_at,
      taggedUsers: data.tagged_users || [],
      notes: data.notes || undefined,
      tags: data.tags || []
    };
  }
  
  async createRecording(recordingData: CreateRecordingData): Promise<Recording | null> {
    const { data, error } = await supabase
      .from("recordings")
      .insert({
        rehearsal_id: recordingData.rehearsalId,
        title: recordingData.title,
        video_url: recordingData.videoUrl,
        thumbnail_url: recordingData.thumbnailUrl,
        duration: recordingData.duration,
        google_file_id: recordingData.googleFileId,
        notes: recordingData.notes,
        tags: recordingData.tags,
        tagged_users: recordingData.taggedUsers
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating recording:", error);
      return null;
    }
    
    return {
      id: data.id,
      rehearsalId: data.rehearsal_id,
      title: data.title,
      videoUrl: data.video_url || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
      duration: data.duration,
      createdAt: data.created_at,
      taggedUsers: data.tagged_users || [],
      notes: data.notes || undefined,
      tags: data.tags || []
    };
  }
  
  async updateRecording(recordingData: UpdateRecordingData): Promise<Recording | null> {
    const updateData: any = {};
    
    if (recordingData.title !== undefined) updateData.title = recordingData.title;
    if (recordingData.rehearsalId !== undefined) updateData.rehearsal_id = recordingData.rehearsalId;
    if (recordingData.videoUrl !== undefined) updateData.video_url = recordingData.videoUrl;
    if (recordingData.thumbnailUrl !== undefined) updateData.thumbnail_url = recordingData.thumbnailUrl;
    if (recordingData.duration !== undefined) updateData.duration = recordingData.duration;
    if (recordingData.googleFileId !== undefined) updateData.google_file_id = recordingData.googleFileId;
    if (recordingData.notes !== undefined) updateData.notes = recordingData.notes;
    if (recordingData.tags !== undefined) updateData.tags = recordingData.tags;
    if (recordingData.taggedUsers !== undefined) updateData.tagged_users = recordingData.taggedUsers;
    
    const { data, error } = await supabase
      .from("recordings")
      .update(updateData)
      .eq("id", recordingData.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating recording:", error);
      return null;
    }
    
    return {
      id: data.id,
      rehearsalId: data.rehearsal_id,
      title: data.title,
      videoUrl: data.video_url || undefined,
      thumbnailUrl: data.thumbnail_url || undefined,
      duration: data.duration,
      createdAt: data.created_at,
      taggedUsers: data.tagged_users || [],
      notes: data.notes || undefined,
      tags: data.tags || []
    };
  }
  
  async deleteRecording(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("recordings")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting recording:", error);
      return false;
    }
    
    return true;
  }
}

export const dataService = new DataService();
