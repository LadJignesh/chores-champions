import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chore } from '@/models';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const payload = getUserFromRequest(request);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Get all chores for the user (assigned or created)
    const chores = await Chore.find({
      $or: [
        { userId: payload.userId },
        { assignedTo: payload.userId },
      ],
    });
    
    // Aggregate completion history by date
    const completionMap = new Map<string, number>();
    
    chores.forEach(chore => {
      chore.completionHistory.forEach(record => {
        // Only count completions by this user
        if (record.completedBy.toString() === payload.userId) {
          const date = record.date;
          completionMap.set(date, (completionMap.get(date) || 0) + 1);
        }
      });
    });
    
    // Convert to array sorted by date
    const history = Array.from(completionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('Get completion history error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
