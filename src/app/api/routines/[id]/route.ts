import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { WorkoutRoutine, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// PATCH - Update routine
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
    
    const routine = await WorkoutRoutine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }
    
    // Verify routine belongs to user
    if (routine.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Update fields
    if (body.name !== undefined) routine.name = body.name.trim();
    if (body.description !== undefined) routine.description = body.description?.trim();
    if (body.category !== undefined) routine.category = body.category;
    if (body.difficulty !== undefined) routine.difficulty = body.difficulty;
    if (body.exercises !== undefined) routine.exercises = body.exercises;
    
    // If marking as used
    if (body.markAsUsed) {
      routine.lastUsed = new Date();
      routine.timesUsed += 1;
    }
    
    await routine.save();
    
    const formattedRoutine = {
      id: routine._id.toString(),
      name: routine.name,
      description: routine.description,
      category: routine.category,
      difficulty: routine.difficulty,
      exercises: routine.exercises,
      isTemplate: routine.isTemplate,
      lastUsed: routine.lastUsed?.toISOString(),
      timesUsed: routine.timesUsed,
      createdAt: routine.createdAt.toISOString(),
      updatedAt: routine.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ routine: formattedRoutine });
  } catch (error) {
    console.error('Error updating routine:', error);
    return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
  }
}

// DELETE - Delete routine
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
    
    const routine = await WorkoutRoutine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }
    
    // Verify routine belongs to user
    if (routine.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await WorkoutRoutine.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Routine deleted successfully' });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json({ error: 'Failed to delete routine' }, { status: 500 });
  }
}
