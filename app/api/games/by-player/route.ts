import { NextRequest, NextResponse } from 'next/server'
import { getGamesByPlayerId } from '@/lib/game/actions'

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = await request.json()

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json(
        { error: 'Player IDs required' },
        { status: 400 }
      )
    }

    const { games, error } = await getGamesByPlayerId(playerIds)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ games })
  } catch (e) {
    console.error('Error fetching games by player:', e)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
