import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Chore, User } from '@/models';
import { getUserFromRequest } from '@/lib/auth';
import { BADGES_DEFINITIONS, LEVEL_THRESHOLDS } from '@/types/gamification';

function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 0;
}

// DELETE - Delete a chore
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    const chore = await Chore.findById(id);
    
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }
    
    await Chore.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chore error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

// PATCH - Toggle completion or update chore
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = await params;
    const { action, ...updates } = await request.json();
    
    const chore = await Chore.findById(id);
    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let pointsEarned = 0;
    let newBadges: typeof BADGES_DEFINITIONS = [];
    
    if (action === 'toggle') {
      // Check if user is allowed to toggle this chore
      // Only the assigned user OR the creator (if no one is assigned) can toggle
      const assignedUserId = chore.assignedTo?.toString() || chore.userId.toString();
      if (assignedUserId !== payload.userId) {
        return NextResponse.json(
          { error: 'Only the assigned person can mark this chore as complete' },
          { status: 403 }
        );
      }
      
      const isCompleting = !chore.isCompleted;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user already completed this chore today (to prevent score manipulation)
      const todayCompletion = chore.completionHistory.find(
        (h: { date: string; completedBy: { toString: () => string } }) => 
          h.date === today && h.completedBy.toString() === payload.userId
      );
      
      if (isCompleting) {
        // Completing the chore
        if (todayCompletion) {
          // Already completed today, don't give points again
          chore.isCompleted = true;
          await chore.save();
          
          return NextResponse.json({
            success: true,
            chore: formatChoreResponse(chore),
            pointsEarned: 0,
            newBadges: [],
            userStats: user.stats,
            message: 'Already completed today, no additional points',
          });
        }
        
        const now = new Date();
        chore.isCompleted = true;
        chore.lastCompleted = now;
        chore.completionHistory.push({
          date: today,
          completedAt: now,
          completedBy: user._id,
        });
        
        // Award points
        pointsEarned = chore.points;
        user.stats.totalPoints += pointsEarned;
        user.stats.weeklyPoints += pointsEarned;
        user.stats.monthlyPoints += pointsEarned;
        user.stats.totalCompleted += 1;
        
        // Update streak
        const lastDate = user.stats.lastCompletedDate;
        if (lastDate) {
          const lastCompleted = new Date(lastDate);
          lastCompleted.setHours(0, 0, 0, 0);
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((todayDate.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            user.stats.currentStreak += 1;
          } else if (diffDays > 1) {
            user.stats.currentStreak = 1;
          }
        } else {
          user.stats.currentStreak = 1;
        }
        
        user.stats.lastCompletedDate = now;
        user.stats.longestStreak = Math.max(user.stats.longestStreak, user.stats.currentStreak);
        
        // Calculate level
        user.stats.level = calculateLevel(user.stats.totalPoints);
        
        // Check for new badges
        const earnedBadgeIds = user.stats.badges.map((b: { id: string }) => b.id);
        
        BADGES_DEFINITIONS.forEach(badgeDef => {
          if (earnedBadgeIds.includes(badgeDef.id)) return;
          
          let earned = false;
          switch (badgeDef.id) {
            case 'first_chore': earned = user.stats.totalCompleted >= 1; break;
            case 'complete_10': earned = user.stats.totalCompleted >= 10; break;
            case 'complete_50': earned = user.stats.totalCompleted >= 50; break;
            case 'complete_100': earned = user.stats.totalCompleted >= 100; break;
            case 'complete_500': earned = user.stats.totalCompleted >= 500; break;
            case 'streak_3': earned = user.stats.currentStreak >= 3; break;
            case 'streak_7': earned = user.stats.currentStreak >= 7; break;
            case 'streak_30': earned = user.stats.currentStreak >= 30; break;
            case 'level_5': earned = user.stats.level >= 5; break;
            case 'level_10': earned = user.stats.level >= 10; break;
            case 'early_bird': earned = now.getHours() < 8; break;
            case 'night_owl': earned = now.getHours() >= 22; break;
          }
          
          if (earned) {
            user.stats.badges.push({
              id: badgeDef.id,
              name: badgeDef.name,
              description: badgeDef.description,
              icon: badgeDef.icon,
              tier: badgeDef.tier,
              earnedAt: now,
            });
            newBadges.push(badgeDef);
          }
        });
        
        await user.save();
      } else {
        // Un-completing the chore - deduct points if completed today
        if (todayCompletion) {
          pointsEarned = -chore.points; // Negative points
          user.stats.totalPoints = Math.max(0, user.stats.totalPoints + pointsEarned);
          user.stats.weeklyPoints = Math.max(0, user.stats.weeklyPoints + pointsEarned);
          user.stats.monthlyPoints = Math.max(0, user.stats.monthlyPoints + pointsEarned);
          user.stats.totalCompleted = Math.max(0, user.stats.totalCompleted - 1);
          
          // Recalculate level
          user.stats.level = calculateLevel(user.stats.totalPoints);
          
          // Remove today's completion from history
          chore.completionHistory = chore.completionHistory.filter(
            (h: { date: string; completedBy: { toString: () => string } }) => 
              !(h.date === today && h.completedBy.toString() === payload.userId)
          );
          
          await user.save();
        }
        
        chore.isCompleted = false;
      }
      
      await chore.save();
    } else if (action === 'reorder') {
      // Handle reorder - update position
      if (updates.position !== undefined) {
        chore.position = updates.position;
        await chore.save();
      }
    } else {
      // Regular update
      Object.assign(chore, updates);
      await chore.save();
    }
    
    return NextResponse.json({
      success: true,
      chore: formatChoreResponse(chore),
      pointsEarned,
      newBadges,
      userStats: user.stats,
    });
  } catch (error) {
    console.error('Update chore error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

// Helper function to format chore response
function formatChoreResponse(chore: any) {
  return {
    id: chore._id.toString(),
    title: chore.title,
    description: chore.description,
    frequency: chore.frequency,
    dayOfWeek: chore.dayOfWeek,
    dayOfMonth: chore.dayOfMonth,
    isCompleted: chore.isCompleted,
    lastCompleted: chore.lastCompleted?.toISOString(),
    completionHistory: chore.completionHistory,
    userId: chore.userId.toString(),
    teamId: chore.teamId.toString(),
    assignedTo: chore.assignedTo?.toString(),
    points: chore.points,
    position: chore.position,
    createdAt: chore.createdAt.toISOString(),
  };
}
