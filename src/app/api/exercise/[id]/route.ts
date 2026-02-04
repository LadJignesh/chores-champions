import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Exercise, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// PATCH - Update exercise
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
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    
    // Verify exercise belongs to user
    if (exercise.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Update fields
    if (body.name !== undefined) exercise.name = body.name.trim();
    if (body.sets !== undefined) exercise.sets = parseInt(body.sets);
    if (body.reps !== undefined) exercise.reps = parseInt(body.reps);
    if (body.duration !== undefined) exercise.duration = body.duration ? parseInt(body.duration) : undefined;
    if (body.notes !== undefined) exercise.notes = body.notes?.trim();
    
    await exercise.save();
    await exercise.populate('userId', 'name');
    
    const formattedExercise = {
      id: exercise._id.toString(),
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration,
      notes: exercise.notes,
      completedAt: exercise.completedAt.toISOString(),
      user: {
        id: (exercise.userId as any)._id.toString(),
        name: (exercise.userId as any).name,
      },
      createdAt: exercise.createdAt.toISOString(),
      updatedAt: exercise.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ exercise: formattedExercise });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 });
  }
}

// DELETE - Delete exercise
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
    
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    
    // Verify exercise belongs to user
    if (exercise.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await Exercise.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 });
  }
}
