'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { GroceryList } from '@/components/GroceryList';
import { ProfileModal } from '@/components/ProfileModal';
import { LeaderboardDropdown } from '@/components/LeaderboardDropdown';
import { NavDropdown } from '@/components/NavDropdown';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  category?: string;
  isPurchased: boolean;
  addedBy: {
    id: string;
    name: string;
  };
  purchasedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function GroceryPage() {
  const { user, team, isAuthenticated, isLoading } = useAuth();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchGroceryItems = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/grocery', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroceryItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch grocery items:', error);
    } finally {
      setLoadingItems(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroceryItems();
    }
  }, [isAuthenticated, fetchGroceryItems]);

  const handleAddItem = async (itemData: {
    name: string;
    quantity?: string;
    category?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/grocery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(itemData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroceryItems(prev => [data.item, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add grocery item:', error);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/grocery/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroceryItems(prev =>
          prev.map(item => item.id === itemId ? data.item : item)
        );
      }
    } catch (error) {
      console.error('Failed to toggle grocery item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/grocery/${itemId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        setGroceryItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to delete grocery item:', error);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: { name: string; quantity?: string; category?: string }
  ) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/grocery/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroceryItems(prev =>
          prev.map(item => item.id === itemId ? data.item : item)
        );
      }
    } catch (error) {
      console.error('Failed to update grocery item:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Grocery List
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsProfileOpen(true)} 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>
            </button>
            
            {team && <LeaderboardDropdown />}
            <NavDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Team Grocery List
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your team&apos;s grocery shopping together
          </p>
        </div>

        {loadingItems ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <GroceryList
            items={groceryItems}
            currentUserId={user?.id || ''}
            onAddItem={handleAddItem}
            onToggleItem={handleToggleItem}
            onDeleteItem={handleDeleteItem}
            onUpdateItem={handleUpdateItem}
          />
        )}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
