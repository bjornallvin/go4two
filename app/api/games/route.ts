import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createGame, createSinglePlayerGame } from '@/lib/game/actions'

export async function POST(request: NextRequest) {
  try {
    // Check auth token (skip if password is "free")
    const createGamePassword = process.env.CREATE_GAME_PASSWORD
    const authToken = process.env.AUTH_TOKEN

    if (createGamePassword !== 'free' && authToken) {
      const cookieStore = await cookies()
      const token = cookieStore.get('auth_token')?.value
      if (token !== authToken) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { boardSize, singlePlayer, playerId } = body

    if (!boardSize || ![9, 13, 19].includes(boardSize)) {
      return NextResponse.json(
        { error: 'Invalid board size' },
        { status: 400 }
      )
    }

    // Create single-player game against AI
    if (singlePlayer) {
      if (!playerId) {
        return NextResponse.json(
          { error: 'Player ID required for single-player' },
          { status: 400 }
        )
      }

      const { game, error } = await createSinglePlayerGame(boardSize, playerId)

      if (error || !game) {
        return NextResponse.json(
          { error: error || 'Failed to create game' },
          { status: 500 }
        )
      }

      return NextResponse.json({ code: game.code, game, singlePlayer: true })
    }

    // Create multiplayer game
    const { game, error } = await createGame(boardSize)

    if (error || !game) {
      return NextResponse.json(
        { error: error || 'Failed to create game' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code: game.code, game })
  } catch (e) {
    console.error('Error creating game:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
