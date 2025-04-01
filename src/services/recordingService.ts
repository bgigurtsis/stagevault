
import { BaseService } from "./baseService";
import { Recording } from "@/types";

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

export class RecordingService extends BaseService {
  async getAllRecordings(): Promise<Recording[]> {
    const { data, error } = await this.supabase
      .from("recordings")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching all recordings:", error);
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

  async getRecentRecordings(limit: number = 10): Promise<Recording[]> {
    const { data, error } = await this.supabase
      .from("recordings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching recent recordings:", error);
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

  async getRecordingsByRehearsalId(rehearsalId: string): Promise<Recording[]> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    
    const { data, error } = await this.supabase
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
    const { error } = await this.supabase
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

export const recordingService = new RecordingService();
