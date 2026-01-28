import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Team } from '@/models';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { name, email, password, teamOption, teamNameOrCode } = await request.json();
    
    // Validate input
    if (!name || !email || !password || !teamOption || !teamNameOrCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    let team;
    
    if (teamOption === 'create') {
      // Create new team
      team = new Team({
        name: teamNameOrCode,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
      await team.save();
    } else {
      // Join existing team
      team = await Team.findOne({ inviteCode: teamNameOrCode.toUpperCase() });
      if (!team) {
        return NextResponse.json(
          { error: `Invalid invite code. No team found with code "${teamNameOrCode.toUpperCase()}"` },
          { status: 400 }
        );
      }
    }
    
    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      teamId: team._id,
      stats: {
        totalPoints: 0,
        level: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCompleted: 0,
        badges: [],
        weeklyPoints: 0,
        monthlyPoints: 0,
      },
    });
    
    await user.save();
    
    // Update team's createdBy if this is a new team
    if (teamOption === 'create') {
      team.createdBy = user._id;
      await team.save();
    }
    
    // Generate token
    const token = signToken({ userId: user._id.toString(), email: user.email });
    
    // Get team members
    const teamMembers = await User.find({ teamId: team._id }).select('-password');
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        teamId: team._id.toString(),
        stats: user.stats,
      },
      team: {
        id: team._id.toString(),
        name: team.name,
        inviteCode: team.inviteCode,
      },
      teamMembers: teamMembers.map(m => ({
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        teamId: m.teamId.toString(),
        stats: m.stats,
      })),
      token,
    });
    
    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
