import { UserStats } from './gamification';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teamId: string;
  createdAt: string;
  stats?: UserStats;
}

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  createdBy: string;
}

export interface AuthState {
  user: User | null;
  team: Team | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
