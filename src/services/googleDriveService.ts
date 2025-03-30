import { supabase } from "@/integrations/supabase/client";

const ROOT_FOLDER_NAME = "StageVault Recordings";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

class GoogleDriveService {
  private async getAccessToken(): Promise<string | null> {
    try {
      console.log("=== Getting Google Drive Access Token ===");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        return null;
      }
      
      if (!session) {
        console.error("No session found");
        return null;
      }
      
      console.log("Session exists, user ID:", session.user.id);
      console.log("Provider:", session.user.app_metadata.provider);
      
      // Get the provider token (Google OAuth token)
      const providerToken = session.provider_token;
      
      if (!providerToken) {
        console.error("=== No provider token found in session ===");
        console.log("Session object keys:", Object.keys(session));
        console.log("User metadata:", session.user.user_metadata);
        console.log("App metadata:", session.user.app_metadata);
        
        // If we have refresh token, we might be able to get a new token
        if (session.refresh_token) {
          console.log("We have refresh token, trying to refresh session");
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            return null;
          }
          
          if (refreshData.session?.provider_token) {
            console.log("Got provider token after refresh!");
            return refreshData.session.provider_token;
          } else {
            console.error("Still no provider token after refresh");
            return null;
          }
        }
        
        return null;
      }
      
      console.log("Provider token found (first 20 chars):", providerToken.substring(0, 20) + "...");
      return providerToken;
    } catch (error) {
      console.error("=== Error getting access token ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return null;
    }
  }

  /**
   * Find a folder by name under a parent folder, or create it if it doesn't exist
   */
  private async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      console.log(`=== Finding/Creating folder: "${folderName}" ===`);
      if (parentFolderId) {
        console.log("Under parent folder ID:", parentFolderId);
      } else {
        console.log("Under root folder");
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.error("No access token available for Google Drive operations");
        return null;
      }
      
      // First, try to find the folder
      const query = parentFolderId 
        ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;
      
      console.log("Search query:", query);
      
      const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!searchResponse.ok) {
        console.error("Error searching for folder:", searchResponse.status, searchResponse.statusText);
        const errorText = await searchResponse.text();
        console.error("Error response:", errorText);
        throw new Error(`Google Drive API error: ${searchResponse.status} ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      console.log("Search results:", searchData);
      
      // If folder exists, return its ID
      if (searchData.files && searchData.files.length > 0) {
        console.log(`Folder "${folderName}" found, ID:`, searchData.files[0].id);
        return searchData.files[0].id;
      }
      
      // Folder doesn't exist, create it
      console.log(`Folder "${folderName}" not found, creating it`);
      
      const metaData = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : ['root'],
      };
      
      console.log("Create folder metadata:", metaData);
      
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaData),
      });
      
      if (!createResponse.ok) {
        console.error("Error creating folder:", createResponse.status, createResponse.statusText);
        const errorText = await createResponse.text();
        console.error("Error response:", errorText);
        throw new Error(`Google Drive API error: ${createResponse.status} ${createResponse.statusText}`);
      }
      
      const folder = await createResponse.json();
      console.log(`Folder "${folderName}" created, ID:`, folder.id);
      return folder.id;
    } catch (error) {
      console.error("=== Error finding or creating folder ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return null;
    }
  }

  /**
   * Ensure the folder hierarchy exists for a performance and rehearsal
   */
  public async ensureFolderStructure(performanceName: string, rehearsalName: string): Promise<string | null> {
    try {
      // Find or create the root StageVault folder
      const rootFolderId = await this.findOrCreateFolder(ROOT_FOLDER_NAME);
      if (!rootFolderId) return null;
      
      // Find or create the performance folder
      const performanceFolderId = await this.findOrCreateFolder(
        `Performance ${performanceName}`, 
        rootFolderId
      );
      if (!performanceFolderId) return null;
      
      // Find or create the rehearsal folder
      const rehearsalFolderId = await this.findOrCreateFolder(
        `Rehearsal ${rehearsalName}`, 
        performanceFolderId
      );
      
      return rehearsalFolderId;
    } catch (error) {
      console.error("Error ensuring folder structure:", error);
      return null;
    }
  }

  /**
   * Upload a video file to Google Drive
   */
  public async uploadVideo(
    videoBlob: Blob, 
    fileName: string, 
    performanceName: string, 
    rehearsalName: string,
    onProgress?: UploadProgressCallback
  ): Promise<DriveFile | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;
      
      // Ensure the folder structure exists
      const parentFolderId = await this.ensureFolderStructure(performanceName, rehearsalName);
      if (!parentFolderId) return null;
      
      // Prepare the metadata
      const metadata = {
        name: fileName,
        parents: [parentFolderId],
      };
      
      // Create a form for the upload
      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', videoBlob);
      
      // For large files, use resumable upload
      // First, get the resumable upload URL
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': videoBlob.type,
            'X-Upload-Content-Length': videoBlob.size.toString(),
          },
          body: JSON.stringify(metadata),
        }
      );
      
      if (!initResponse.ok) {
        throw new Error(`Failed to initialize upload: ${initResponse.statusText}`);
      }
      
      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('No upload URL provided in response');
      }
      
      // Read the file as chunks for progress tracking
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(videoBlob.size / chunkSize);
      let uploadedChunks = 0;
      
      for (let start = 0; start < videoBlob.size; start += chunkSize) {
        const end = Math.min(start + chunkSize, videoBlob.size);
        const chunk = videoBlob.slice(start, end);
        
        const chunkResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Range': `bytes ${start}-${end - 1}/${videoBlob.size}`,
            'Content-Length': `${chunk.size}`,
            'Content-Type': videoBlob.type,
          },
          body: chunk,
        });
        
        uploadedChunks++;
        
        if (onProgress) {
          onProgress((uploadedChunks / totalChunks) * 100);
        }
        
        // If this is the last chunk, get the file metadata
        if (end === videoBlob.size) {
          const fileData = await chunkResponse.json();
          
          // Get additional file details
          const fileDetailsResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileData.id}?fields=id,name,mimeType,webViewLink,thumbnailLink`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          if (fileDetailsResponse.ok) {
            const fileDetails = await fileDetailsResponse.json();
            return fileDetails as DriveFile;
          }
          
          return {
            id: fileData.id,
            name: fileData.name,
            mimeType: fileData.mimeType,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error uploading video:", error);
      return null;
    }
  }

  /**
   * Get file details by ID
   */
  public async getFileDetails(fileId: string): Promise<DriveFile | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,thumbnailLink`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get file details: ${response.statusText}`);
      }
      
      const fileData = await response.json();
      return fileData as DriveFile;
    } catch (error) {
      console.error("Error getting file details:", error);
      return null;
    }
  }

  /**
   * Delete a file by ID
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return false;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
}

export const googleDriveService = new GoogleDriveService();
