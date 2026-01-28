import { Chore } from '@/types/chore';

const STORAGE_KEY = 'daily-chores-tracker';

export const storage = {
  getChores: (): Chore[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chores:', error);
      return [];
    }
  },

  saveChores: (chores: Chore[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chores));
    } catch (error) {
      console.error('Error saving chores:', error);
    }
  },

  addChore: (chore: Chore): void => {
    const chores = storage.getChores();
    chores.push(chore);
    storage.saveChores(chores);
  },

  updateChore: (id: string, updates: Partial<Chore>): void => {
    const chores = storage.getChores();
    const index = chores.findIndex(c => c.id === id);
    if (index !== -1) {
      chores[index] = { ...chores[index], ...updates };
      storage.saveChores(chores);
    }
  },

  deleteChore: (id: string): void => {
    const chores = storage.getChores().filter(c => c.id !== id);
    storage.saveChores(chores);
  },
};
