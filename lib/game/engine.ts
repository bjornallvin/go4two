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

interface TerritoryPosition {
  x: number
  y: number
  color: PlayerColor
}

interface TerritoryData {
  black: {
    territory: number
    captures: number
    total: number
  }
  white: {
    territory: number
    captures: number
    total: number
  }
  territories: TerritoryPosition[]
  winner: PlayerColor | 'tie' | null
}

// Flood-fill to find connected empty regions and determine territory owner
function calculateTerritory(
  game: typeof TenukiGame,
  boardSize: number
): { territories: TerritoryPosition[]; blackTerritory: number; whiteTerritory: number } {
  const visited = new Set<string>()
  const territories: TerritoryPosition[] = []
  let blackTerritory = 0
  let whiteTerritory = 0

  const getKey = (x: number, y: number) => `${x},${y}`

  // Flood-fill from a starting empty point to find the entire region
  const floodFill = (startX: number, startY: number): { points: { x: number; y: number }[]; owner: PlayerColor | null } => {
    const points: { x: number; y: number }[] = []
    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }]
    const regionVisited = new Set<string>()
    let touchesBlack = false
    let touchesWhite = false

    while (stack.length > 0) {
      const { x, y } = stack.pop()!
      const key = getKey(x, y)

      if (regionVisited.has(key)) continue
      if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) continue

      const intersection = game.intersectionAt(y, x)

      if (intersection.value === 'black') {
        touchesBlack = true
        continue
      }
      if (intersection.value === 'white') {
        touchesWhite = true
        continue
      }

      // Empty intersection
      regionVisited.add(key)
      visited.add(key)
      points.push({ x, y })

      // Add neighbors
      stack.push({ x: x + 1, y })
      stack.push({ x: x - 1, y })
      stack.push({ x, y: y + 1 })
      stack.push({ x, y: y - 1 })
    }

    // Determine owner: must touch only one color
    let owner: PlayerColor | null = null
    if (touchesBlack && !touchesWhite) {
      owner = 'black'
    } else if (touchesWhite && !touchesBlack) {
      owner = 'white'
    }
    // If touches both or neither, it's neutral (no owner)

    return { points, owner }
  }

  // Scan all intersections
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const key = getKey(x, y)
      if (visited.has(key)) continue

      const intersection = game.intersectionAt(y, x)
      if (intersection.value !== 'empty') continue

      // Found an unvisited empty point, flood fill to find the region
      const { points, owner } = floodFill(x, y)

      if (owner) {
        for (const point of points) {
          territories.push({ x: point.x, y: point.y, color: owner })
        }
        if (owner === 'black') {
          blackTerritory += points.length
        } else {
          whiteTerritory += points.length
        }
      }
    }
  }

  return { territories, blackTerritory, whiteTerritory }
}

// Get detailed territory data including positions for visual overlay
export function getTerritoryData(boardSize: number, moves: Move[], komi = 6.5): TerritoryData {
  const game = createEngineFromMoves(boardSize, moves)

  // Count captures from moves
  let blackCaptures = 0
  let whiteCaptures = 0
  for (const move of moves) {
    if (move.move_type === 'captured') {
      if (move.player_color === 'white') {
        blackCaptures++ // White stone was captured by black
      } else {
        whiteCaptures++ // Black stone was captured by white
      }
    }
  }

  // Calculate territory using flood-fill
  const { territories, blackTerritory, whiteTerritory } = calculateTerritory(game, boardSize)

  const blackTotal = blackTerritory + blackCaptures
  const whiteTotal = whiteTerritory + whiteCaptures + komi

  let winner: PlayerColor | 'tie' | null = null
  if (blackTotal > whiteTotal) {
    winner = 'black'
  } else if (whiteTotal > blackTotal) {
    winner = 'white'
  } else {
    winner = 'tie'
  }

  return {
    black: {
      territory: blackTerritory,
      captures: blackCaptures,
      total: blackTotal,
    },
    white: {
      territory: whiteTerritory,
      captures: whiteCaptures,
      total: whiteTotal,
    },
    territories,
    winner,
  }
}
