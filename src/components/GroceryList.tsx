'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit2, ShoppingCart, ChevronDown } from 'lucide-react';

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

interface GroceryListProps {
  items: GroceryItem[];
  currentUserId: string;
  onAddItem: (item: { name: string; quantity?: string; category?: string }) => Promise<void>;
  onToggleItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onUpdateItem: (itemId: string, updates: { name: string; quantity?: string; category?: string }) => Promise<void>;
}

// Common Indian weekly groceries organized by category
const PRESET_GROCERIES = {
  'Vegetables': [
    'Onion', 'Tomato', 'Potato', 'Green Chilli', 'Ginger', 'Garlic', 'Coriander Leaves',
    'Curry Leaves', 'Spinach (Palak)', 'Cauliflower', 'Cabbage', 'Carrot', 'Beans',
    'Capsicum', 'Brinjal (Baingan)', 'Lady Finger (Bhindi)', 'Bottle Gourd (Lauki)',
    'Bitter Gourd (Karela)', 'Peas', 'Methi Leaves', 'Mint Leaves'
  ],
  'Fruits': [
    'Banana', 'Apple', 'Orange', 'Mango', 'Grapes', 'Papaya', 'Pomegranate',
    'Watermelon', 'Guava', 'Lemon', 'Coconut'
  ],
  'Dairy': [
    'Milk', 'Curd (Dahi)', 'Paneer', 'Butter', 'Ghee', 'Cheese', 'Cream'
  ],
  'Grains & Pulses': [
    'Rice', 'Wheat Flour (Atta)', 'Toor Dal', 'Moong Dal', 'Chana Dal', 'Urad Dal',
    'Masoor Dal', 'Rajma', 'Chana (Chickpeas)', 'Poha', 'Suji (Semolina)', 'Besan'
  ],
  'Spices & Masala': [
    'Turmeric Powder', 'Red Chilli Powder', 'Coriander Powder', 'Cumin Powder',
    'Garam Masala', 'Cumin Seeds (Jeera)', 'Mustard Seeds', 'Salt', 'Black Pepper'
  ],
  'Oil & Essentials': [
    'Cooking Oil', 'Mustard Oil', 'Coconut Oil', 'Sugar', 'Jaggery', 'Tea', 'Coffee'
  ],
  'Snacks & Others': [
    'Bread', 'Eggs', 'Biscuits', 'Namkeen', 'Papad', 'Pickle (Achar)', 'Noodles'
  ]
};

export function GroceryList({
  items,
  currentUserId,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItem,
}: GroceryListProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: '', category: '' });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || isAdding) return;
    
    setIsAdding(true);
    await onAddItem({ name: newItemName.trim() });
    setNewItemName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemName.trim()) {
      handleQuickAdd(e);
    }
  };

  const handlePresetAdd = async (name: string, category: string) => {
    if (isAdding) return;
    setIsAdding(true);
    await onAddItem({ name, category });
    setIsAdding(false);
  };

  const handleEditSubmit = async (itemId: string) => {
    if (!editForm.name.trim()) return;
    
    await onUpdateItem(itemId, {
      name: editForm.name,
      quantity: editForm.quantity || undefined,
      category: editForm.category || undefined,
    });
    
    setEditingId(null);
  };

  const startEdit = (item: GroceryItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity || '',
      category: item.category || '',
    });
  };

  const activeItems = items.filter(item => !item.isPurchased);
  const purchasedItems = items.filter(item => item.isPurchased);

  return (
    <div className="space-y-6">
      {/* Quick Add Input - Always Visible */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add item... (press Enter)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAdding}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!newItemName.trim() || isAdding}
            className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
        
        {/* Quick Add Presets */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            Quick Add Common Items
          </button>
          
          {showPresets && (
            <div className="mt-3 space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(PRESET_GROCERIES).map(([category, groceryItems]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {groceryItems.map((groceryName) => {
                      const alreadyAdded = items.some(
                        (item) => item.name.toLowerCase() === groceryName.toLowerCase() && !item.isPurchased
                      );
                      return (
                        <button
                          key={groceryName}
                          type="button"
                          disabled={alreadyAdded || isAdding}
                          onClick={() => handlePresetAdd(groceryName, category)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                            alreadyAdded
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          {alreadyAdded ? '✓ ' : '+ '}{groceryName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Items */}
      {activeItems.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            Shopping List ({activeItems.length})
          </h2>
          <div className="space-y-2">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                />
                
                {editingId === item.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Quantity"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(item.id)}
                        className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {item.name}
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.quantity && <span>Qty: {item.quantity}</span>}
                        {item.category && <span className="text-indigo-500">• {item.category}</span>}
                        <span>• Added by {item.addedBy.name}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this item?')) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Purchased ({purchasedItems.length})
          </h2>
          <div className="space-y-2">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 opacity-60"
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-md bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-600 dark:text-slate-400 line-through">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                    {item.purchasedBy && `Purchased by ${item.purchasedBy.name}`}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('Delete this item?')) {
                      onDeleteItem(item.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            No grocery items yet. Add your first item to get started!
          </p>
        </div>
      )}
    </div>
  );
}
