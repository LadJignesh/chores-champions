import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { WorkoutRoutine, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// GET - Fetch all routines for user
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
    
    const routines = await WorkoutRoutine.find({ userId: user._id }).sort({ timesUsed: -1, createdAt: -1 });
    
    const formattedRoutines = routines.map((routine) => ({
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
    }));
    
    return NextResponse.json({ routines: formattedRoutines });
  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json({ error: 'Failed to fetch routines' }, { status: 500 });
  }
}

// POST - Create new routine
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
    const { name, description, category, difficulty, exercises } = body;
    
    if (!name || !category || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: 'Name, category, and at least one exercise are required' },
        { status: 400 }
      );
    }
    
    const routine = await WorkoutRoutine.create({
      name: name.trim(),
      description: description?.trim(),
      category,
      difficulty: difficulty || 'Intermediate',
      exercises,
      userId: user._id,
      teamId: user.teamId,
      isTemplate: false,
      timesUsed: 0,
    });
    
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
    
    return NextResponse.json({ routine: formattedRoutine }, { status: 201 });
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json({ error: 'Failed to create routine' }, { status: 500 });
  }
}
