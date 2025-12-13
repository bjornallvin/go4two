import { pool } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Game, Move, PlayerColor } from '@/lib/types'
import { validateMove, isGameOver } from './engine'

function generateGameCode(): string {
  return nanoid(6).toLowerCase()
}

export async function createGame(boardSize: number): Promise<{ game: Game | null; error: string | null }> {
  const code = generateGameCode()

  try {
    const result = await pool.query<Game>(
      `INSERT INTO games (code, board_size, status, current_turn)
       VALUES ($1, $2, 'waiting', 'black')
       RETURNING *`,
      [code, boardSize]
    )

    return { game: result.rows[0], error: null }
  } catch (e) {
    console.error('Error creating game:', e)
    return { game: null, error: 'Failed to create game' }
  }
}

export async function getGameByCode(code: string): Promise<{ game: Game | null; error: string | null }> {
  try {
    const result = await pool.query<Game>(
      'SELECT * FROM games WHERE code = $1',
      [code.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return { game: null, error: 'Game not found' }
    }

    return { game: result.rows[0], error: null }
  } catch (e) {
    console.error('Error fetching game:', e)
    return { game: null, error: 'Failed to fetch game' }
  }
}

export async function getGameWithMoves(code: string): Promise<{ game: Game | null; moves: Move[]; error: string | null }> {
  try {
    const gameResult = await pool.query<Game>(
      'SELECT * FROM games WHERE code = $1',
      [code.toLowerCase()]
    )

    if (gameResult.rows.length === 0) {
      return { game: null, moves: [], error: 'Game not found' }
    }

    const game = gameResult.rows[0]

    const movesResult = await pool.query<Move>(
      'SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC',
      [game.id]
    )

    return { game, moves: movesResult.rows, error: null }
  } catch (e) {
    console.error('Error fetching game with moves:', e)
    return { game: null, moves: [], error: 'Failed to fetch game' }
  }
}

export async function joinGame(
  code: string,
  playerId: string
): Promise<{ game: Game | null; playerColor: PlayerColor | null; error: string | null }> {
  try {
    const gameResult = await pool.query<Game>(
      'SELECT * FROM games WHERE code = $1',
      [code.toLowerCase()]
    )

    if (gameResult.rows.length === 0) {
      return { game: null, playerColor: null, error: 'Game not found' }
    }

    const game = gameResult.rows[0]

    // Check if player is already in the game
    if (game.black_player_id === playerId) {
      return { game, playerColor: 'black', error: null }
    }
    if (game.white_player_id === playerId) {
      return { game, playerColor: 'white', error: null }
    }

    // Game is full
    if (game.black_player_id && game.white_player_id) {
      return { game: null, playerColor: null, error: 'Game is full' }
    }

    // First player to join
    if (!game.black_player_id && !game.white_player_id) {
      const isBlack = Math.random() < 0.5
      const column = isBlack ? 'black_player_id' : 'white_player_id'

      const result = await pool.query<Game>(
        `UPDATE games SET ${column} = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [playerId, game.id]
      )

      return { game: result.rows[0], playerColor: isBlack ? 'black' : 'white', error: null }
    }

    // Second player joins
    const isBlackTaken = !!game.black_player_id
    const column = isBlackTaken ? 'white_player_id' : 'black_player_id'

    const result = await pool.query<Game>(
      `UPDATE games SET ${column} = $1, status = 'active', updated_at = NOW() WHERE id = $2 RETURNING *`,
      [playerId, game.id]
    )

    return { game: result.rows[0], playerColor: isBlackTaken ? 'white' : 'black', error: null }
  } catch (e) {
    console.error('Error joining game:', e)
    return { game: null, playerColor: null, error: 'Failed to join game' }
  }
}

export async function makeMove(
  gameId: string,
  playerId: string,
  x: number,
  y: number
): Promise<{ move: Move | null; captures: { x: number; y: number }[]; error: string | null }> {
  try {
    const gameResult = await pool.query<Game>(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    )

    if (gameResult.rows.length === 0) {
      return { move: null, captures: [], error: 'Game not found' }
    }

    const game = gameResult.rows[0]

    // Determine player's color
    let playerColor: PlayerColor | null = null
    if (game.black_player_id === playerId) playerColor = 'black'
    if (game.white_player_id === playerId) playerColor = 'white'

    if (!playerColor) {
      return { move: null, captures: [], error: 'You are not in this game' }
    }

    if (game.status !== 'active') {
      return { move: null, captures: [], error: 'Game is not active' }
    }

    // Get existing moves
    const movesResult = await pool.query<Move>(
      'SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC',
      [gameId]
    )
    const moves = movesResult.rows

    // Validate move using Tenuki engine
    const validation = validateMove(game.board_size, moves, x, y, playerColor)

    if (!validation.valid) {
      return { move: null, captures: [], error: validation.error || 'Invalid move' }
    }

    const moveNumber = moves.length + 1

    // Insert the move
    const moveResult = await pool.query<Move>(
      `INSERT INTO moves (game_id, player_color, x, y, move_number, move_type)
       VALUES ($1, $2, $3, $4, $5, 'place')
       RETURNING *`,
      [gameId, playerColor, x, y, moveNumber]
    )

    // Record captures as separate moves
    const captures = validation.captures
    for (let i = 0; i < captures.length; i++) {
      const cap = captures[i]
      // Find the color of the captured stone (opponent's color)
      const capturedColor: PlayerColor = playerColor === 'black' ? 'white' : 'black'
      await pool.query(
        `INSERT INTO moves (game_id, player_color, x, y, move_number, move_type)
         VALUES ($1, $2, $3, $4, $5, 'captured')`,
        [gameId, capturedColor, cap.x, cap.y, moveNumber + i + 1]
      )
    }

    // Update turn
    const nextTurn: PlayerColor = playerColor === 'black' ? 'white' : 'black'
    await pool.query(
      'UPDATE games SET current_turn = $1, updated_at = NOW() WHERE id = $2',
      [nextTurn, gameId]
    )

    return { move: moveResult.rows[0], captures, error: null }
  } catch (e) {
    console.error('Error making move:', e)
    return { move: null, captures: [], error: 'Failed to make move' }
  }
}

export async function passTurn(
  gameId: string,
  playerId: string
): Promise<{ success: boolean; gameOver: boolean; error: string | null }> {
  try {
    const gameResult = await pool.query<Game>(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    )

    if (gameResult.rows.length === 0) {
      return { success: false, gameOver: false, error: 'Game not found' }
    }

    const game = gameResult.rows[0]

    let playerColor: PlayerColor | null = null
    if (game.black_player_id === playerId) playerColor = 'black'
    if (game.white_player_id === playerId) playerColor = 'white'

    if (!playerColor) {
      return { success: false, gameOver: false, error: 'You are not in this game' }
    }

    if (game.current_turn !== playerColor) {
      return { success: false, gameOver: false, error: 'Not your turn' }
    }

    if (game.status !== 'active') {
      return { success: false, gameOver: false, error: 'Game is not active' }
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM moves WHERE game_id = $1',
      [gameId]
    )
    const moveNumber = parseInt(countResult.rows[0].count) + 1

    // Record pass
    await pool.query(
      `INSERT INTO moves (game_id, player_color, x, y, move_number, move_type)
       VALUES ($1, $2, -1, -1, $3, 'pass')`,
      [gameId, playerColor, moveNumber]
    )

    // Get all moves including the new pass to check for game end
    const movesResult = await pool.query<Move>(
      'SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC',
      [gameId]
    )
    const allMoves = movesResult.rows

    // Check if game is over (two consecutive passes)
    const gameOver = isGameOver(game.board_size, allMoves)

    if (gameOver) {
      // Mark game as finished
      await pool.query(
        "UPDATE games SET status = 'finished', updated_at = NOW() WHERE id = $1",
        [gameId]
      )
    } else {
      // Update turn
      const nextTurn: PlayerColor = playerColor === 'black' ? 'white' : 'black'
      await pool.query(
        'UPDATE games SET current_turn = $1, updated_at = NOW() WHERE id = $2',
        [nextTurn, gameId]
      )
    }

    return { success: true, gameOver, error: null }
  } catch (e) {
    console.error('Error passing turn:', e)
    return { success: false, gameOver: false, error: 'Failed to pass' }
  }
}

export async function resignGame(
  gameId: string,
  playerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const gameResult = await pool.query<Game>(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    )

    if (gameResult.rows.length === 0) {
      return { success: false, error: 'Game not found' }
    }

    const game = gameResult.rows[0]

    let playerColor: PlayerColor | null = null
    if (game.black_player_id === playerId) playerColor = 'black'
    if (game.white_player_id === playerId) playerColor = 'white'

    if (!playerColor) {
      return { success: false, error: 'You are not in this game' }
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM moves WHERE game_id = $1',
      [gameId]
    )
    const moveNumber = parseInt(countResult.rows[0].count) + 1

    // Record resignation
    await pool.query(
      `INSERT INTO moves (game_id, player_color, x, y, move_number, move_type)
       VALUES ($1, $2, -1, -1, $3, 'resign')`,
      [gameId, playerColor, moveNumber]
    )

    // End game
    await pool.query(
      "UPDATE games SET status = 'finished', updated_at = NOW() WHERE id = $1",
      [gameId]
    )

    return { success: true, error: null }
  } catch (e) {
    console.error('Error resigning:', e)
    return { success: false, error: 'Failed to resign' }
  }
}
