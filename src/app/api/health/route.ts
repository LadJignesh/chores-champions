import { NextResponse } from 'next/server';

// Health check endpoint for Railway
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
