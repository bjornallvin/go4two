import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    const correctPassword = process.env.CREATE_GAME_PASSWORD
    const authToken = process.env.AUTH_TOKEN

    // If password is "free", allow access without authentication
    if (correctPassword === 'free') {
      return NextResponse.json({ success: true })
    }

    if (!correctPassword || !authToken) {
      // If not configured, allow access (dev mode)
      return NextResponse.json({ success: true })
    }

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Set the auth token cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error in auth:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const correctPassword = process.env.CREATE_GAME_PASSWORD
  const authToken = process.env.AUTH_TOKEN

  // If password is "free", allow access without authentication
  if (correctPassword === 'free') {
    return NextResponse.json({ authenticated: true })
  }

  if (!authToken) {
    // If not configured, allow access
    return NextResponse.json({ authenticated: true })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  return NextResponse.json({ authenticated: token === authToken })
}
