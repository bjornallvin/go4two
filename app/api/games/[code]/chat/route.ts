import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages, saveChatMessage } from '@/lib/game/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const { messages, error } = await getChatMessages(code)

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  return NextResponse.json({ messages })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const body = await request.json()
  const { playerId, message } = body

  if (!playerId || !message) {
    return NextResponse.json({ error: 'Missing playerId or message' }, { status: 400 })
  }

  const result = await saveChatMessage(code, playerId, message)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, message: result.message })
}
