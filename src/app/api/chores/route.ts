import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chore, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

const POINTS_CONFIG = {
  daily: 10,
  weekly: 25,
  biweekly: 35,
  monthly: 50,
};

// GET - Fetch all chores for team
export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if requesting all chores (for weekly table)
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('all') === 'true';
    
    await dbConnect();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const chores = await Chore.find({ teamId: user.teamId }).sort({ createdAt: -1 });
    
    // Reset completion status for chores based on frequency and filter by scheduled day
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentDayOfMonth = now.getDate();
    
    // Helper to check if a chore should be shown today based on its schedule
    const isChoreScheduledForToday = (chore: typeof chores[0]): boolean => {
      // Daily chores always show
      if (chore.frequency === 'daily') return true;
      
      // For non-daily chores, check startDate first
      if (chore.startDate) {
        const startDate = new Date(chore.startDate);
        // Don't show if start date is in the future
        if (startDate > now) return false;
      }
      
      if (chore.frequency === 'weekly') {
        // Support both single day (dayOfWeek) and multiple days (daysOfWeek)
        if (chore.daysOfWeek && chore.daysOfWeek.length > 0) {
          return chore.daysOfWeek.includes(currentDayOfWeek);
        }
        return chore.dayOfWeek === currentDayOfWeek;
      }
      
      if (chore.frequency === 'biweekly') {
        // Check if today matches any of the specified days
        const matchesDay = chore.daysOfWeek && chore.daysOfWeek.length > 0
          ? chore.daysOfWeek.includes(currentDayOfWeek)
          : chore.dayOfWeek === currentDayOfWeek;
        
        if (!matchesDay) return false;
        
        // Calculate weeks since start date
        const startDate = chore.startDate ? new Date(chore.startDate) : new Date(chore.createdAt);
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / msPerWeek);
        return weeksSinceStart % 2 === 0;
      }
      
      if (chore.frequency === 'monthly') {
        // Show on the specified day of month
        return chore.dayOfMonth === currentDayOfMonth;
      }
      
      return true;
    };
    
    const updatedChores = await Promise.all(chores.map(async (chore) => {
      if (chore.isCompleted && chore.lastCompleted) {
        const lastCompleted = new Date(chore.lastCompleted);
        let shouldReset = false;
        
        if (chore.frequency === 'daily') {
          shouldReset = lastCompleted.toDateString() !== now.toDateString();
        } else if (chore.frequency === 'weekly') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          shouldReset = lastCompleted < weekAgo;
        } else if (chore.frequency === 'biweekly') {
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          shouldReset = lastCompleted < twoWeeksAgo;
        } else if (chore.frequency === 'monthly') {
          shouldReset = lastCompleted.getMonth() !== now.getMonth() || 
                       lastCompleted.getFullYear() !== now.getFullYear();
        }
        
        if (shouldReset) {
          chore.isCompleted = false;
          await chore.save();
        }
      }
      return chore;
    }));
    
    // Filter chores to only show those scheduled for today (unless ?all=true)
    const scheduledChores = fetchAll ? updatedChores : updatedChores.filter(isChoreScheduledForToday);
    
    return NextResponse.json({
      success: true,
      chores: scheduledChores.map(c => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        frequency: c.frequency,
        dayOfWeek: c.dayOfWeek,
        daysOfWeek: c.daysOfWeek,
        dayOfMonth: c.dayOfMonth,
        startDate: c.startDate?.toISOString(),
        isCompleted: c.isCompleted,
        lastCompleted: c.lastCompleted?.toISOString(),
        completionHistory: c.completionHistory,
        userId: c.userId.toString(),
        teamId: c.teamId.toString(),
        assignedTo: c.assignedTo?.toString(),
        points: c.points,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get chores error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

// POST - Create new chore
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
    
    const { title, description, frequency, dayOfWeek, daysOfWeek, dayOfMonth, startDate, assignedTo } = await request.json();
    
    if (!title || !frequency) {
      return NextResponse.json({ error: 'Title and frequency are required' }, { status: 400 });
    }
    
    const chore = new Chore({
      title,
      description,
      frequency,
      dayOfWeek,
      daysOfWeek: daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      dayOfMonth,
      startDate: startDate ? new Date(startDate) : undefined,
      userId: user._id,
      teamId: user.teamId,
      assignedTo: assignedTo || undefined,
      points: POINTS_CONFIG[frequency as keyof typeof POINTS_CONFIG],
      isCompleted: false,
      completionHistory: [],
    });
    
    await chore.save();
    
    return NextResponse.json({
      success: true,
      chore: {
        id: chore._id.toString(),
        title: chore.title,
        description: chore.description,
        frequency: chore.frequency,
        dayOfWeek: chore.dayOfWeek,
        daysOfWeek: chore.daysOfWeek,
        dayOfMonth: chore.dayOfMonth,
        startDate: chore.startDate?.toISOString(),
        isCompleted: chore.isCompleted,
        lastCompleted: chore.lastCompleted?.toISOString(),
        completionHistory: chore.completionHistory,
        userId: chore.userId.toString(),
        teamId: chore.teamId.toString(),
        assignedTo: chore.assignedTo?.toString(),
        points: chore.points,
        createdAt: chore.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Create chore error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
