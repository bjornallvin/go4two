import type { Move, PlayerColor } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Game: TenukiGame } = require('tenuki')

interface MoveValidation {
  valid: boolean
  error?: string
  captures: { x: number; y: number }[]
}

interface GameScore {
  black: number
  white: number
}

// Reconstruct Tenuki game from moves
export function createEngineFromMoves(boardSize: number, moves: Move[]): typeof TenukiGame {
  const game = new TenukiGame({ boardSize })

  for (const move of moves) {
    if (move.move_type === 'place') {
      // Tenuki uses (row, col) = (y, x)
      game.playAt(move.y, move.x)
    } else if (move.move_type === 'pass') {
      game.pass()
    }
    // Skip 'captured' and 'resign' moves - they don't affect game state
  }

  return game
}

// Get snapshot of board state
function getBoardSnapshot(
  game: typeof TenukiGame,
  size: number
): Map<string, PlayerColor> {
  const snapshot = new Map<string, PlayerColor>()
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const intersection = game.intersectionAt(y, x)
      if (intersection.value === 'black' || intersection.value === 'white') {
        snapshot.set(`${x},${y}`, intersection.value as PlayerColor)
      }
    }
  }
  return snapshot
}

// Detect which stones were captured by comparing before/after
function detectCaptures(
  before: Map<string, PlayerColor>,
  gameAfter: typeof TenukiGame,
  size: number,
  currentPlayer: PlayerColor
): { x: number; y: number }[] {
  const opponent = currentPlayer === 'black' ? 'white' : 'black'
  const captures: { x: number; y: number }[] = []

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const key = `${x},${y}`
      const wasThere = before.get(key)
      const nowThere = gameAfter.intersectionAt(y, x).value

      // Stone was opponent's before, now empty = captured
      if (wasThere === opponent && nowThere === 'empty') {
        captures.push({ x, y })
      }
    }
  }

  return captures
}

// Validate a new move using Tenuki rules
export function validateMove(
  boardSize: number,
  moves: Move[],
  x: number,
  y: number,
  playerColor: PlayerColor
): MoveValidation {
  const game = createEngineFromMoves(boardSize, moves)

  // Check it's the right player's turn
  if (game.currentPlayer() !== playerColor) {
    return { valid: false, error: 'Not your turn', captures: [] }
  }

  // Check if game is already over
  if (game.isOver()) {
    return { valid: false, error: 'Game is already over', captures: [] }
  }

  // Get board state before move to detect captures
  const boardBefore = getBoardSnapshot(game, boardSize)

  // Try the move - returns false if illegal (ko, suicide, occupied)
  // Tenuki uses (row, col) = (y, x)
  const success = game.playAt(y, x)

  if (!success) {
    return { valid: false, error: 'Illegal move (ko, suicide, or occupied)', captures: [] }
  }

  // Detect captures by comparing before/after
  const captures = detectCaptures(boardBefore, game, boardSize, playerColor)

  return { valid: true, captures }
}

// Check if game is over (two consecutive passes)
export function isGameOver(boardSize: number, moves: Move[]): boolean {
  const game = createEngineFromMoves(boardSize, moves)
  return game.isOver()
}

// Get score (only valid after game is over)
export function getScore(boardSize: number, moves: Move[], komi = 6.5): GameScore | null {
  const game = createEngineFromMoves(boardSize, moves)

  if (!game.isOver()) {
    return null
  }

  const score = game.score()
  return {
    black: score.black,
    white: score.white + komi,
  }
}

// Get current player's turn
export function getCurrentPlayer(boardSize: number, moves: Move[]): PlayerColor {
  const game = createEngineFromMoves(boardSize, moves)
  return game.currentPlayer() as PlayerColor
}
