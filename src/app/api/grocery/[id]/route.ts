import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { GroceryItem, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// PATCH - Update grocery item (toggle purchased or edit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const groceryItem = await GroceryItem.findById(id);
    if (!groceryItem) {
      return NextResponse.json({ error: 'Grocery item not found' }, { status: 404 });
    }
    
    // Verify item belongs to user's team
    if (groceryItem.teamId.toString() !== user.teamId.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Toggle purchased status
    if (body.action === 'toggle') {
      groceryItem.isPurchased = !groceryItem.isPurchased;
      groceryItem.purchasedBy = groceryItem.isPurchased ? user._id : undefined;
    } else {
      // Update item details
      if (body.name !== undefined) groceryItem.name = body.name.trim();
      if (body.quantity !== undefined) groceryItem.quantity = body.quantity?.trim();
      if (body.category !== undefined) groceryItem.category = body.category?.trim();
    }
    
    await groceryItem.save();
    await groceryItem.populate('addedBy', 'name');
    if (groceryItem.purchasedBy) {
      await groceryItem.populate('purchasedBy', 'name');
    }
    
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
      purchasedBy: groceryItem.purchasedBy ? {
        id: (groceryItem.purchasedBy as any)._id.toString(),
        name: (groceryItem.purchasedBy as any).name,
      } : undefined,
      createdAt: groceryItem.createdAt.toISOString(),
      updatedAt: groceryItem.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ item: formattedItem });
  } catch (error) {
    console.error('Error updating grocery item:', error);
    return NextResponse.json({ error: 'Failed to update grocery item' }, { status: 500 });
  }
}

// DELETE - Delete grocery item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const groceryItem = await GroceryItem.findById(id);
    if (!groceryItem) {
      return NextResponse.json({ error: 'Grocery item not found' }, { status: 404 });
    }
    
    // Verify item belongs to user's team
    if (groceryItem.teamId.toString() !== user.teamId.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await GroceryItem.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Grocery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting grocery item:', error);
    return NextResponse.json({ error: 'Failed to delete grocery item' }, { status: 500 });
  }
}
