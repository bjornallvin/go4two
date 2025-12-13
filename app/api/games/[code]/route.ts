import { NextRequest, NextResponse } from 'next/server'
import { getGameWithMoves } from '@/lib/game/actions'

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

  return NextResponse.json({ game, moves })
}
