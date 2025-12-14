import type { Move, PlayerColor } from '@/lib/types'
import { createEngineFromMoves, validateMove, isGameOver } from './engine'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Game: TenukiGame } = require('tenuki')

interface AIMove {
  x: number
  y: number
  score: number
  reason: string
}

interface BoardAnalysis {
  game: typeof TenukiGame
  boardSize: number
  aiColor: PlayerColor
  opponent: PlayerColor
  moveCount: number
}

/**
 * Improved Go AI with look-ahead and tactical awareness
 *
 * Features:
 * 1. 2-ply look-ahead (considers opponent response)
 * 2. Ladder detection
 * 3. Self-atari avoidance
 * 4. Territory/influence evaluation
 * 5. Opening book for corners
 * 6. Cut and connection awareness
 */
export function generateAIMove(
  boardSize: number,
  moves: Move[],
  aiColor: PlayerColor
): { x: number; y: number } | 'pass' {
  const game = createEngineFromMoves(boardSize, moves)
  const opponent: PlayerColor = aiColor === 'black' ? 'white' : 'black'
  const moveCount = moves.filter(m => m.move_type === 'place').length

  // If game is already over, pass
  if (isGameOver(boardSize, moves)) {
    return 'pass'
  }

  const analysis: BoardAnalysis = { game, boardSize, aiColor, opponent, moveCount }

  // Opening book - first few moves should be corners/star points
  if (moveCount < 6) {
    const openingMove = getOpeningMove(analysis, moves)
    if (openingMove) {
      return openingMove
    }
  }

  // Collect all valid moves with scores
  const candidates: AIMove[] = []

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const validation = validateMove(boardSize, moves, x, y, aiColor)
      if (validation.valid) {
        const score = evaluateMoveWithLookahead(analysis, moves, x, y, validation.captures)
        candidates.push({ x, y, score: score.score, reason: score.reason })
      }
    }
  }

  // No valid moves, pass
  if (candidates.length === 0) {
    return 'pass'
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score)

  // If the best move has a very low score, consider passing
  const bestScore = candidates[0].score
  if (bestScore < 10) {
    const lastGameMove = moves.filter(m => m.move_type === 'place' || m.move_type === 'pass').slice(-1)[0]
    if (lastGameMove && lastGameMove.move_type === 'pass') {
      return 'pass'
    }
    if (bestScore < 0) {
      return 'pass'
    }
  }

  // Pick from top moves with some randomness for variety
  const topMoves = candidates.slice(0, Math.min(3, candidates.length))

  // Less randomness - usually pick the best move
  if (topMoves[0].score > topMoves[1]?.score + 30) {
    // Clear best move, take it
    return { x: topMoves[0].x, y: topMoves[0].y }
  }

  // Some randomness among close moves
  const weights = [0.7, 0.2, 0.1]
  const random = Math.random()
  let cumulative = 0

  for (let i = 0; i < topMoves.length; i++) {
    cumulative += weights[i] || 0.05
    if (random < cumulative) {
      return { x: topMoves[i].x, y: topMoves[i].y }
    }
  }

  return { x: candidates[0].x, y: candidates[0].y }
}

/**
 * Opening book - play standard corner moves in the opening
 */
function getOpeningMove(
  analysis: BoardAnalysis,
  moves: Move[]
): { x: number; y: number } | null {
  const { boardSize, aiColor } = analysis
  const placedMoves = moves.filter(m => m.move_type === 'place')

  // Get occupied positions
  const occupied = new Set(placedMoves.map(m => `${m.x},${m.y}`))

  // Standard corner approaches based on board size
  let corners: [number, number][]
  if (boardSize === 9) {
    corners = [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]]
  } else if (boardSize === 13) {
    corners = [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]]
  } else {
    corners = [[3, 3], [3, 15], [15, 3], [15, 15], [9, 9], [3, 9], [9, 3], [9, 15], [15, 9]]
  }

  // Shuffle corners for variety
  corners = corners.sort(() => Math.random() - 0.5)

  // Find first unoccupied corner
  for (const [x, y] of corners) {
    if (!occupied.has(`${x},${y}`)) {
      const validation = validateMove(boardSize, moves, x, y, aiColor)
      if (validation.valid) {
        return { x, y }
      }
    }
  }

  return null
}

/**
 * Evaluate move with 1-ply look-ahead (consider opponent's best response)
 */
function evaluateMoveWithLookahead(
  analysis: BoardAnalysis,
  moves: Move[],
  x: number,
  y: number,
  captures: { x: number; y: number }[]
): { score: number; reason: string } {
  const { game, boardSize, aiColor, opponent, moveCount } = analysis

  // Base evaluation
  let score = 0
  let reason = 'valid'

  // === IMMEDIATE TACTICAL EVALUATION ===

  // High priority: Captures (especially large groups)
  if (captures.length > 0) {
    score += 150 + captures.length * 30
    reason = `capture ${captures.length}`

    // Extra bonus for capturing during a ladder/chase
    if (captures.length >= 2) {
      score += 50
    }
  }

  // Check for self-atari (BAD - avoid unless it captures)
  if (captures.length === 0) {
    const selfAtari = checkSelfAtari(game, boardSize, x, y, aiColor, moves)
    if (selfAtari > 0) {
      score -= 100 + selfAtari * 50  // Heavy penalty
      reason = 'self-atari (bad)'
      return { score, reason }  // Early return - this is usually a bad move
    }
  }

  // Save own group from atari (very important)
  const savesFromAtari = checkSavesFromAtari(game, boardSize, x, y, aiColor)
  if (savesFromAtari > 0) {
    // Check if this escape leads to a ladder we lose
    const isLadder = detectLadder(game, boardSize, x, y, aiColor, opponent, moves)
    if (isLadder) {
      score -= 50  // Bad escape - we'll get captured anyway
      reason = 'ladder (losing)'
    } else {
      score += 120 + savesFromAtari * 25
      reason = `escape atari (${savesFromAtari})`
    }
  }

  // Put opponent in atari
  const putsInAtari = checkPutsOpponentInAtari(game, boardSize, x, y, aiColor)
  if (putsInAtari > 0) {
    // Check if this starts a ladder we win
    const startsWinningLadder = detectLadder(game, boardSize, x, y, opponent, aiColor, moves)
    if (startsWinningLadder) {
      score += 100 + putsInAtari * 20
      reason = `ladder attack (${putsInAtari})`
    } else {
      score += 70 + putsInAtari * 15
      reason = `atari (${putsInAtari})`
    }
  }

  // === STRATEGIC EVALUATION ===

  // Cutting moves (separate opponent groups)
  const cuttingValue = evaluateCut(game, boardSize, x, y, opponent)
  if (cuttingValue > 0) {
    score += 60 + cuttingValue * 10
    if (reason === 'valid') reason = 'cut'
  }

  // Connecting own groups
  const connectionValue = evaluateConnection(game, boardSize, x, y, aiColor)
  if (connectionValue > 0) {
    score += 40 + connectionValue * 8
    if (reason === 'valid') reason = 'connect'
  }

  // Extend own groups
  const friendlyNeighbors = countFriendlyNeighbors(game, boardSize, x, y, aiColor)
  const enemyNeighbors = countFriendlyNeighbors(game, boardSize, x, y, opponent)

  if (friendlyNeighbors > 0 && enemyNeighbors > 0) {
    // Contact fight - important move
    score += 35 + friendlyNeighbors * 5 + enemyNeighbors * 5
    if (reason === 'valid') reason = 'contact'
  } else if (friendlyNeighbors > 0) {
    score += 25 + friendlyNeighbors * 5
    if (reason === 'valid') reason = 'extend'
  }

  // === POSITIONAL EVALUATION ===

  // Corner and side bonuses (especially in opening/midgame)
  if (moveCount < boardSize * 2) {
    const cornerBonus = getCornerBonus(boardSize, x, y)
    score += cornerBonus
    if (cornerBonus > 15 && reason === 'valid') {
      reason = 'corner/side'
    }
  }

  // Avoid first line unless necessary
  const edgeDist = Math.min(x, y, boardSize - 1 - x, boardSize - 1 - y)
  if (edgeDist === 0) {
    score -= 20  // First line is usually bad
  } else if (edgeDist === 1) {
    score -= 5   // Second line is often too low
  }

  // Influence toward center in opening
  if (moveCount < 20) {
    const centerDist = Math.abs(x - boardSize / 2) + Math.abs(y - boardSize / 2)
    score += Math.max(0, 10 - centerDist)
  }

  // === LOOK-AHEAD ===
  // Simulate opponent's best response and see if our position improves
  if (score > 0 && captures.length === 0) {
    const lookaheadPenalty = evaluateOpponentResponse(analysis, moves, x, y)
    score += lookaheadPenalty
  }

  // Small random factor for variety (reduced from before)
  score += Math.random() * 3

  return { score, reason }
}

/**
 * Check if playing here puts our own stones in atari (self-atari)
 */
function checkSelfAtari(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  color: PlayerColor,
  moves: Move[]
): number {
  // Simulate the move
  const newMoves: Move[] = [...moves, {
    id: 'temp',
    game_id: 'temp',
    player_color: color,
    x,
    y,
    move_number: moves.length + 1,
    move_type: 'place',
    created_at: ''
  }]

  try {
    const newGame = createEngineFromMoves(boardSize, newMoves)

    // Check if the stone we just played is in atari
    const intersection = newGame.intersectionAt(y, x)
    if (intersection.value === color) {
      try {
        if (newGame.inAtari(y, x)) {
          const group = newGame.groupAt(y, x)
          return group ? group.length : 1
        }
      } catch {
        // Method might not exist
      }
    }
  } catch {
    // Invalid move simulation
  }

  return 0
}

/**
 * Simple ladder detection - checks if escaping/chasing leads to capture
 */
function detectLadder(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  escapingColor: PlayerColor,
  chasingColor: PlayerColor,
  moves: Move[]
): boolean {
  // Simple ladder detection: if the escaping stone is near the edge,
  // and has limited liberties, it's likely a losing ladder

  const edgeDist = Math.min(x, y, boardSize - 1 - x, boardSize - 1 - y)

  // If we're near the edge, ladders are more likely to work for the chaser
  if (edgeDist <= 3) {
    // Check if there are friendly stones that could break the ladder
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    let friendlyNearby = 0

    for (const [dx, dy] of directions) {
      for (let dist = 1; dist <= 4; dist++) {
        const nx = x + dx * dist
        const ny = y + dy * dist
        if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) break

        const intersection = game.intersectionAt(ny, nx)
        if (intersection.value === escapingColor) {
          friendlyNearby++
          break
        } else if (intersection.value === chasingColor) {
          break
        }
      }
    }

    // If few friendly stones nearby and near edge, likely losing ladder
    return friendlyNearby < 2
  }

  return false
}

/**
 * Evaluate if this move cuts opponent's groups
 */
function evaluateCut(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  opponent: PlayerColor
): number {
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  const opponentGroups = new Set<string>()

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue

    const intersection = game.intersectionAt(ny, nx)
    if (intersection.value === opponent) {
      // Get group ID (using position of any stone in group as identifier)
      try {
        const group = game.groupAt(ny, nx)
        if (group && group.length > 0) {
          opponentGroups.add(`${group[0].y},${group[0].x}`)
        }
      } catch {
        opponentGroups.add(`${ny},${nx}`)
      }
    }
  }

  // If this move is adjacent to multiple opponent groups, it might cut them
  return opponentGroups.size >= 2 ? opponentGroups.size * 2 : 0
}

/**
 * Evaluate if this move connects our groups
 */
function evaluateConnection(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  color: PlayerColor
): number {
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  const friendlyGroups = new Set<string>()

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue

    const intersection = game.intersectionAt(ny, nx)
    if (intersection.value === color) {
      try {
        const group = game.groupAt(ny, nx)
        if (group && group.length > 0) {
          friendlyGroups.add(`${group[0].y},${group[0].x}`)
        }
      } catch {
        friendlyGroups.add(`${ny},${nx}`)
      }
    }
  }

  // Connecting multiple groups is good
  return friendlyGroups.size >= 2 ? friendlyGroups.size * 2 : 0
}

/**
 * Simple look-ahead: evaluate opponent's best response
 */
function evaluateOpponentResponse(
  analysis: BoardAnalysis,
  moves: Move[],
  x: number,
  y: number
): number {
  const { boardSize, aiColor, opponent } = analysis

  // Simulate our move
  const newMoves: Move[] = [...moves, {
    id: 'temp',
    game_id: 'temp',
    player_color: aiColor,
    x,
    y,
    move_number: moves.length + 1,
    move_type: 'place',
    created_at: ''
  }]

  // Find opponent's best response (simplified - just check for captures and atari escapes)
  let worstPenalty = 0

  try {
    const newGame = createEngineFromMoves(boardSize, newMoves)

    for (let oy = 0; oy < boardSize; oy++) {
      for (let ox = 0; ox < boardSize; ox++) {
        const validation = validateMove(boardSize, newMoves, ox, oy, opponent)
        if (validation.valid) {
          // Opponent can capture our stones
          if (validation.captures.length > 0) {
            const capturePenalty = validation.captures.length * 25
            worstPenalty = Math.max(worstPenalty, capturePenalty)
          }

          // Opponent can put us in atari
          const putsUsInAtari = checkPutsOpponentInAtari(newGame, boardSize, ox, oy, opponent)
          if (putsUsInAtari > 0) {
            const atariPenalty = putsUsInAtari * 10
            worstPenalty = Math.max(worstPenalty, atariPenalty)
          }
        }
      }
    }
  } catch {
    // Simulation failed
  }

  return -worstPenalty
}

function checkSavesFromAtari(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  color: PlayerColor
): number {
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  let savedStones = 0

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy

    if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue

    const intersection = game.intersectionAt(ny, nx)
    if (intersection.value === color) {
      try {
        if (game.inAtari(ny, nx)) {
          const group = game.groupAt(ny, nx)
          if (group) {
            savedStones += group.length
          }
        }
      } catch {
        // Tenuki method might not exist
      }
    }
  }

  return savedStones
}

function checkPutsOpponentInAtari(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  color: PlayerColor
): number {
  const opponent = color === 'black' ? 'white' : 'black'
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  let threatenedStones = 0
  const countedGroups = new Set<string>()

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy

    if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue

    const intersection = game.intersectionAt(ny, nx)
    if (intersection.value === opponent) {
      try {
        const liberties = game.libertiesAt(ny, nx)
        if (liberties === 2) {
          const group = game.groupAt(ny, nx)
          if (group) {
            const groupKey = `${group[0].y},${group[0].x}`
            if (!countedGroups.has(groupKey)) {
              countedGroups.add(groupKey)
              threatenedStones += group.length
            }
          }
        }
      } catch {
        // Method might not exist
      }
    }
  }

  return threatenedStones
}

function countFriendlyNeighbors(
  game: typeof TenukiGame,
  boardSize: number,
  x: number,
  y: number,
  color: PlayerColor
): number {
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]
  let count = 0

  for (const [dx, dy] of directions) {
    const nx = x + dx
    const ny = y + dy

    if (nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize) continue

    const intersection = game.intersectionAt(ny, nx)
    if (intersection.value === color) {
      count++
    }
  }

  return count
}

function getCornerBonus(boardSize: number, x: number, y: number): number {
  const starPoints = getStarPoints(boardSize)

  for (const [sx, sy] of starPoints) {
    if (x === sx && y === sy) {
      return 30
    }
  }

  // 3-4 and 4-4 points are good
  const edgeDistX = Math.min(x, boardSize - 1 - x)
  const edgeDistY = Math.min(y, boardSize - 1 - y)

  // Corner area (both coordinates near edge)
  if (edgeDistX <= 4 && edgeDistY <= 4) {
    if ((edgeDistX === 2 || edgeDistX === 3) && (edgeDistY === 2 || edgeDistY === 3)) {
      return 25  // 3-3, 3-4, 4-3, 4-4 points
    }
  }

  // Side extension points
  if ((edgeDistX <= 4 && edgeDistY >= 4) || (edgeDistY <= 4 && edgeDistX >= 4)) {
    if (edgeDistX === 3 || edgeDistY === 3) {
      return 15  // Third line extensions
    }
  }

  return 0
}

function getStarPoints(boardSize: number): [number, number][] {
  if (boardSize === 9) {
    return [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]]
  } else if (boardSize === 13) {
    return [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6], [3, 6], [6, 3], [6, 9], [9, 6]]
  } else if (boardSize === 19) {
    return [
      [3, 3], [3, 9], [3, 15],
      [9, 3], [9, 9], [9, 15],
      [15, 3], [15, 9], [15, 15]
    ]
  }
  return []
}
