import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User, Team } from '@/models';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 400 }
      );
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 400 }
      );
    }
    
    // Get team
    const team = await Team.findById(user.teamId);
    
    // Get team members
    const teamMembers = await User.find({ teamId: user.teamId }).select('-password');
    
    // Generate token
    const token = signToken({ userId: user._id.toString(), email: user.email });
    
    const response = NextResponse.json({
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
