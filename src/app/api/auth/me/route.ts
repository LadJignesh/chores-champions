import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Team } from '@/models';
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
    
    const user = await User.findById(payload.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const team = await Team.findById(user.teamId);
    const teamMembers = await User.find({ teamId: user.teamId }).select('-password');
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        teamId: user.teamId.toString(),
        stats: user.stats,
      },
      team: team ? {
        id: team._id.toString(),
        name: team.name,
        inviteCode: team.inviteCode,
      } : null,
      teamMembers: teamMembers.map(m => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        teamId: m.teamId.toString(),
        stats: m.stats,
      })),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
