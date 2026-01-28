'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chore, ChoreFrequency } from '@/types/chore';
import { POINTS_CONFIG, UserStats } from '@/types/gamification';

interface UseChoresOptions {
  onComplete?: (points: number, stats: UserStats) => void;
}

export function useChores(options: UseChoresOptions = {}) {
  const { onComplete } = options;
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  };

  // Fetch chores on mount
  useEffect(() => {
    const fetchChores = async () => {
      try {
        const response = await fetch('/api/chores', {
          headers: getAuthHeader(),
        });

        if (response.ok) {
          const data = await response.json();
          setChores(data.chores);
        }
      } catch (error) {
        console.error('Error fetching chores:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchChores();
  }, []);

  const addChore = useCallback(async (choreData: {
    title: string;
    description?: string;
    frequency: ChoreFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    assignedTo?: string;
  }) => {
    try {
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(choreData),
      });

      if (response.ok) {
        const data = await response.json();
        setChores(prev => [data.chore, ...prev]);
        return data.chore;
      }
    } catch (error) {
      console.error('Error adding chore:', error);
    }
    return null;
  }, []);

  const deleteChore = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        setChores(prev => prev.filter(c => c.id !== id));
        return true;
      }
    } catch (error) {
      console.error('Error deleting chore:', error);
    }
    return false;
  }, []);

  const toggleCompletion = useCallback(async (id: string): Promise<{ success: boolean; error?: string; points: number }> => {
    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ action: 'toggle' }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error, points: 0 };
      }
      
      setChores(prev => prev.map(c => c.id === id ? data.chore : c));
      
      if (data.pointsEarned !== 0 && onComplete) {
        onComplete(data.pointsEarned, data.userStats);
      }
      
      return { success: true, points: data.pointsEarned || 0 };
    } catch (error) {
      console.error('Error toggling chore:', error);
      return { success: false, error: 'An error occurred', points: 0 };
    }
  }, [onComplete]);

  const updateChore = useCallback(async (id: string, updates: Partial<Chore>) => {
    try {
      const response = await fetch(`/api/chores/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setChores(prev => prev.map(c => c.id === id ? data.chore : c));
        return data.chore;
      }
    } catch (error) {
      console.error('Error updating chore:', error);
    }
    return null;
  }, []);

  const refreshChores = useCallback(async () => {
    try {
      const response = await fetch('/api/chores', {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        setChores(data.chores);
      }
    } catch (error) {
      console.error('Error refreshing chores:', error);
    }
  }, []);

  const reorderChores = useCallback((newOrder: Chore[]) => {
    setChores(newOrder);
    
    // Update positions in background
    newOrder.forEach(async (chore, index) => {
      if (chore.position !== index) {
        try {
          await fetch(`/api/chores/${chore.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(),
            },
            body: JSON.stringify({ action: 'reorder', position: index }),
          });
        } catch (error) {
          console.error('Error updating chore position:', error);
        }
      }
    });
  }, []);

  return {
    chores,
    setChores,
    isLoaded,
    addChore,
    updateChore,
    deleteChore,
    toggleCompletion,
    refreshChores,
    reorderChores,
  };
}
