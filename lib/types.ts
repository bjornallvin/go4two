export type GameStatus = 'waiting' | 'active' | 'finished'
export type PlayerColor = 'black' | 'white'
export type MoveType = 'place' | 'pass' | 'resign' | 'captured'

export interface Game {
  id: string
  code: string
  board_size: number
  status: GameStatus
  current_turn: PlayerColor
  black_player_id: string | null
  white_player_id: string | null
  created_at: string
  updated_at: string
}

export interface Move {
  id: string
  game_id: string
  player_color: PlayerColor
  x: number
  y: number
  move_number: number
  move_type: MoveType
  created_at: string
}

// Board position (x, y) -> stone color
export type BoardState = Map<string, PlayerColor>

// Helper to convert moves to board state (replays moves in order)
export function movesToBoardState(moves: Move[]): BoardState {
  const board = new Map<string, PlayerColor>()

  // Replay moves in order - 'place' adds stone, 'captured' removes stone
  for (const move of moves) {
    const key = `${move.x},${move.y}`
    if (move.move_type === 'place') {
      board.set(key, move.player_color)
    } else if (move.move_type === 'captured') {
      board.delete(key)
    }
  }
  return board
}

// Helper to get position key
export function posKey(x: number, y: number): string {
  return `${x},${y}`
}
