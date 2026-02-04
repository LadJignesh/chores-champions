import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { GroceryItem, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// GET - Fetch all grocery items for team
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const groceryItems = await GroceryItem.find({ teamId: user.teamId })
      .populate('addedBy', 'name')
      .populate('purchasedBy', 'name')
      .sort({ isPurchased: 1, createdAt: -1 });
    
    const formattedItems = groceryItems.map(item => ({
      id: item._id.toString(),
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      isPurchased: item.isPurchased,
      addedBy: {
        id: item.addedBy._id.toString(),
        name: (item.addedBy as any).name,
      },
      purchasedBy: item.purchasedBy ? {
        id: (item.purchasedBy as any)._id.toString(),
        name: (item.purchasedBy as any).name,
      } : undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    return NextResponse.json({ error: 'Failed to fetch grocery items' }, { status: 500 });
  }
}

// POST - Add new grocery item
export async function POST(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { name, quantity, category } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }
    
    const groceryItem = await GroceryItem.create({
      name: name.trim(),
      quantity: quantity?.trim(),
      category: category?.trim(),
      addedBy: user._id,
      teamId: user.teamId,
      isPurchased: false,
    });
    
    await groceryItem.populate('addedBy', 'name');
    
    const formattedItem = {
      id: groceryItem._id.toString(),
      name: groceryItem.name,
      quantity: groceryItem.quantity,
      category: groceryItem.category,
      isPurchased: groceryItem.isPurchased,
      addedBy: {
        id: groceryItem.addedBy._id.toString(),
        name: (groceryItem.addedBy as any).name,
      },
      createdAt: groceryItem.createdAt.toISOString(),
      updatedAt: groceryItem.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ item: formattedItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding grocery item:', error);
    return NextResponse.json({ error: 'Failed to add grocery item' }, { status: 500 });
  }
}
