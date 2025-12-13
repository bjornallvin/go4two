import type * as Party from "partykit/server"

// Message types
type CursorMessage = {
  type: 'cursor'
  playerId: string
  x: number
  y: number
  color: 'black' | 'white'
  isDragging: boolean
}

type GameUpdateMessage = {
  type: 'game_update'
  game: unknown
  moves: unknown[]
}

type JoinMessage = {
  type: 'join'
  playerId: string
}

type LeaveMessage = {
  type: 'leave'
  playerId: string
}

type Message = CursorMessage | GameUpdateMessage | JoinMessage | LeaveMessage

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Store connected players
  players: Map<string, { odI: string; playerId: string }> = new Map()

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // New connection - they'll send a join message with their playerId
    console.log(`Connection ${conn.id} joined room ${this.room.id}`)
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as Message

      switch (data.type) {
        case 'join':
          // Track this player
          this.players.set(sender.id, { odI: sender.id, playerId: data.playerId })
          // Notify others
          this.room.broadcast(JSON.stringify({
            type: 'player_joined',
            playerId: data.playerId
          }), [sender.id])
          break

        case 'cursor':
          // Broadcast cursor position to all OTHER clients
          this.room.broadcast(message, [sender.id])
          break

        case 'game_update':
          // Broadcast game state update to all OTHER clients
          this.room.broadcast(message, [sender.id])
          break

        default:
          // Unknown message type - just broadcast it
          this.room.broadcast(message, [sender.id])
      }
    } catch (e) {
      console.error('Failed to parse message:', e)
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id)
    if (player) {
      // Notify others that player left
      this.room.broadcast(JSON.stringify({
        type: 'player_left',
        playerId: player.playerId
      }))
      this.players.delete(conn.id)
    }
    console.log(`Connection ${conn.id} left room ${this.room.id}`)
  }
}

GameServer satisfies Party.Worker
