import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { WorkoutRoutine, Exercise, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get suggested routine for today
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
    
    // Get user's routines
    const userRoutines = await WorkoutRoutine.find({ userId: user._id });
    
    if (userRoutines.length === 0) {
      return NextResponse.json({ 
        suggestion: null,
        message: 'No routines available. Create your first routine to get started!' 
      });
    }
    
    // Get today's exercises to see what categories were already done
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayExercises = await Exercise.find({
      userId: user._id,
      completedAt: {
        $gte: today,
        $lt: tomorrow,
      }
    });
    
    // Simple suggestion algorithm:
    // 1. If no exercises done today, suggest least recently used or most popular routine
    // 2. If exercises done, suggest a different category
    // 3. Rotate through categories: Upper Body -> Lower Body -> Core -> Full Body -> Cardio
    
    let suggestedRoutine;
    
    if (todayExercises.length === 0) {
      // No exercises today - suggest the routine used longest ago, or if never used, the newest one
      const routinesWithUsage = userRoutines.sort((a, b) => {
        if (!a.lastUsed && !b.lastUsed) {
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first
        }
        if (!a.lastUsed) return -1; // Unused routines first
        if (!b.lastUsed) return 1;
        return a.lastUsed.getTime() - b.lastUsed.getTime(); // Least recently used first
      });
      
      suggestedRoutine = routinesWithUsage[0];
    } else {
      // Has exercises - try to find different category
      const doneCategories = new Set(userRoutines
        .filter(r => r.lastUsed && r.lastUsed.toDateString() === today.toDateString())
        .map(r => r.category));
      
      // Find routines not done today
      const availableRoutines = userRoutines.filter(r => !doneCategories.has(r.category));
      
      if (availableRoutines.length > 0) {
        // Suggest based on category rotation or least recently used
        suggestedRoutine = availableRoutines.sort((a, b) => {
          if (!a.lastUsed && !b.lastUsed) return b.createdAt.getTime() - a.createdAt.getTime();
          if (!a.lastUsed) return -1;
          if (!b.lastUsed) return 1;
          return a.lastUsed.getTime() - b.lastUsed.getTime();
        })[0];
      } else {
        // All categories done - suggest least recently used
        suggestedRoutine = userRoutines.sort((a, b) => {
          if (!a.lastUsed) return -1;
          if (!b.lastUsed) return 1;
          return a.lastUsed.getTime() - b.lastUsed.getTime();
        })[0];
      }
    }
    
    const formattedRoutine = {
      id: suggestedRoutine._id.toString(),
      name: suggestedRoutine.name,
      description: suggestedRoutine.description,
      category: suggestedRoutine.category,
      difficulty: suggestedRoutine.difficulty,
      exercises: suggestedRoutine.exercises,
      lastUsed: suggestedRoutine.lastUsed?.toISOString(),
      timesUsed: suggestedRoutine.timesUsed,
      reason: todayExercises.length === 0 
        ? 'Start your day with this routine!'
        : 'Try this to work different muscle groups',
    };
    
    return NextResponse.json({ suggestion: formattedRoutine });
  } catch (error) {
    console.error('Error getting suggestion:', error);
    return NextResponse.json({ error: 'Failed to get suggestion' }, { status: 500 });
  }
}
