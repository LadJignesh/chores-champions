import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Exercise, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// GET - Fetch exercises for user
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Optional: filter by specific date
    
    let query: any = { userId: user._id };
    
    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.completedAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    } else {
      // Default: get today's exercises
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.completedAt = {
        $gte: today,
        $lt: tomorrow,
      };
    }
    
    const exercises = await Exercise.find(query)
      .sort({ completedAt: -1 })
      .populate('userId', 'name');
    
    const formattedExercises = exercises.map((exercise) => ({
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
    }));
    
    return NextResponse.json({ exercises: formattedExercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

// POST - Add new exercise
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
    
    const body = await request.json();
    const { name, sets, reps, duration, notes, completedAt } = body;
    
    if (!name || !sets || !reps) {
      return NextResponse.json(
        { error: 'Name, sets, and reps are required' },
        { status: 400 }
      );
    }
    
    const exercise = await Exercise.create({
      name: name.trim(),
      userId: user._id,
      teamId: user.teamId,
      sets: parseInt(sets),
      reps: parseInt(reps),
      duration: duration ? parseInt(duration) : undefined,
      notes: notes?.trim(),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });
    
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
    
    return NextResponse.json({ exercise: formattedExercise }, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
