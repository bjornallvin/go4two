import { NextRequest, NextResponse } from 'next/server'
import { getGameWithMoves } from '@/lib/game/actions'
import { getTerritoryData } from '@/lib/game/engine'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params

  const { game, moves, error } = await getGameWithMoves(code)

  if (error || !game) {
    return NextResponse.json(
      { error: error || 'Game not found' },
      { status: 404 }
    )
  }

  try {
    const territoryData = getTerritoryData(game.board_size, moves)
    return NextResponse.json(territoryData)
  } catch (e) {
    console.error('Error calculating territory:', e)
    return NextResponse.json(
      { error: 'Failed to calculate territory' },
      { status: 500 }
    )
  }
}
