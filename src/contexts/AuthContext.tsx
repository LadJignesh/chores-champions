'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Team, AuthState } from '@/types/user';
import { UserStats } from '@/types/gamification';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, teamOption: 'create' | 'join', teamNameOrCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  userStats: UserStats | null;
  teamMembers: User[];
  updateUserStats: (stats: UserStats) => void;
  refreshTeamMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    team: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Load current user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          setAuthState({
            user: data.user,
            team: data.team,
            isAuthenticated: true,
            isLoading: false,
          });
          setUserStats(data.user.stats);
          setTeamMembers(data.teamMembers);
        } else {
          localStorage.removeItem('auth_token');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('auth_token', data.token);

      setAuthState({
        user: data.user,
        team: data.team,
        isAuthenticated: true,
        isLoading: false,
      });
      setUserStats(data.user.stats);
      setTeamMembers(data.teamMembers);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    teamOption: 'create' | 'join',
    teamNameOrCode: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, teamOption, teamNameOrCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      localStorage.setItem('auth_token', data.token);

      setAuthState({
        user: data.user,
        team: data.team,
        isAuthenticated: true,
        isLoading: false,
      });
      setUserStats(data.user.stats);
      setTeamMembers(data.teamMembers);

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An error occurred during signup' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('auth_token');
    setAuthState({
      user: null,
      team: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setUserStats(null);
    setTeamMembers([]);
  }, []);

  const updateUserStats = useCallback((stats: UserStats) => {
    setUserStats(stats);
  }, []);

  const refreshTeamMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.teamMembers);
        setUserStats(data.user.stats);
      }
    } catch (error) {
      console.error('Error refreshing team members:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        userStats,
        teamMembers,
        updateUserStats,
        refreshTeamMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
