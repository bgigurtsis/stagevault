import { Rehearsal } from "@/types";
import { dataService } from "./dataService";

// Add a getRecentRehearsals method that Dashboard.tsx is trying to use
const getRecentRehearsals = async (limit: number = 3): Promise<Rehearsal[]> => {
  try {
    const response = await dataService.get(`/rehearsals?_sort=date:DESC&_limit=${limit}`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching recent rehearsals:", error);
    return [];
  }
};

// Assuming there's an existing getRehearsals method that needs to be kept
const getRehearsals = async (): Promise<Rehearsal[]> => {
  try {
    const response = await dataService.get("/rehearsals");
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching rehearsals:", error);
    return [];
  }
};

const getRehearsalById = async (id: string): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.get(`/rehearsals/${id}`);
    return response || null;
  } catch (error) {
    console.error(`Error fetching rehearsal with ID ${id}:`, error);
    return null;
  }
};

const createRehearsal = async (rehearsal: Rehearsal): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.post('/rehearsals', rehearsal);
    return response || null;
  } catch (error) {
    console.error('Error creating rehearsal:', error);
    return null;
  }
};

const updateRehearsal = async (id: string, rehearsal: Partial<Rehearsal>): Promise<Rehearsal | null> => {
  try {
    const response = await dataService.put(`/rehearsals/${id}`, rehearsal);
    return response || null;
  } catch (error) {
    console.error(`Error updating rehearsal with ID ${id}:`, error);
    return null;
  }
};

const deleteRehearsal = async (id: string): Promise<boolean> => {
  try {
    await dataService.delete(`/rehearsals/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting rehearsal with ID ${id}:`, error);
    return false;
  }
};

export const rehearsalService = {
  getRehearsals,
  getRecentRehearsals,
  getRehearsalById,
  createRehearsal,
  updateRehearsal,
  deleteRehearsal,
};
