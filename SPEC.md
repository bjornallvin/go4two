# Go4Two - Multiplayer Go Game Specification

## Overview

A simple multiplayer Go board game where two players can play together via a shared link. No automatic rule enforcement - just stone placement on a traditional Go board grid.

## Core Features

### Game Creation & Joining
- Create a new game with a unique game code (e.g., `abc123`)
- Shareable link format: `https://go4two.app/game/{code}`
- First player creates game, second player joins via link
- Random assignment of black/white when both players have joined

### Board Configuration
- Selectable board sizes:
  - 9×9 (beginner)
  - 13×13 (intermediate)
  - 19×19 (standard)
- Classic Go board appearance with grid lines and star points (hoshi)

### Gameplay
- **Drag-and-drop** stone placement
- **Snap-to-grid** when dropping stones on intersections
- Alternating turns (black plays first, as per Go rules)
- No automatic capture detection - players manage this manually
- No automatic scoring - players agree on the result
- Pass turn option
- Resign option

### Real-time Features
- Live updates when opponent places a stone
- Connection status indicator
- Turn indicator showing whose move it is

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase Postgres
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Deployment**: Vercel

### Database Schema

```sql
-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  board_size INTEGER NOT NULL DEFAULT 19,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, active, finished
  current_turn VARCHAR(10) DEFAULT 'black', -- black, white
  black_player_id VARCHAR(50),
  white_player_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moves table (stores all stone placements)
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_color VARCHAR(10) NOT NULL, -- black, white
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  move_number INTEGER NOT NULL,
  move_type VARCHAR(10) NOT NULL DEFAULT 'place', -- place, pass, resign
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_moves_game_id ON moves(game_id);
```

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games` | Create a new game |
| GET | `/api/games/[code]` | Get game state |
| POST | `/api/games/[code]/join` | Join an existing game |
| POST | `/api/games/[code]/move` | Make a move |
| POST | `/api/games/[code]/pass` | Pass turn |
| POST | `/api/games/[code]/resign` | Resign game |

### Player Identification

Simple approach using browser localStorage:
- Generate a unique player ID on first visit
- Store in localStorage
- Send with all API requests
- No authentication required (anonymous play)

### Real-time Updates

Using Supabase Realtime subscriptions:
- Subscribe to game changes when joining
- Subscribe to new moves on the game
- Update local state when opponent makes a move

## UI Components

### Pages
1. **Home** (`/`) - Create new game, enter game code
2. **Game** (`/game/[code]`) - The actual game board

### Components
- `Board` - The Go board with grid lines
- `Stone` - Individual black/white stones
- `DraggableStone` - Stone that can be dragged from supply
- `GameInfo` - Turn indicator, player colors, game status
- `GameControls` - Pass, resign buttons
- `ShareLink` - Copy game link to clipboard
- `ConnectionStatus` - Shows if connected/disconnected

## User Flow

```
1. Player A visits homepage
2. Player A selects board size and clicks "Create Game"
3. Game is created with status "waiting"
4. Player A sees the board and a shareable link
5. Player A shares link with Player B
6. Player B opens link
7. Both players assigned random colors (black/white)
8. Game status changes to "active"
9. Black player goes first
10. Players alternate turns until they agree to end
```

## Design Notes

### Board Appearance
- Wood-textured background (CSS gradient)
- Black grid lines
- Star points (hoshi) on traditional positions
- Stones should have slight gradient/shadow for depth
- Responsive: scales to fit screen

### Drag & Drop Behavior
- Pick up stone from your supply (unlimited)
- Drag over board
- Visual indicator of snap position
- Drop to place
- Invalid if: not your turn, intersection occupied

### Mobile Considerations
- Touch-friendly drag and drop
- Board should fit on mobile screens
- Consider tap-to-place as alternative to drag

## Out of Scope (v1)
- User accounts/authentication
- Game history/replay
- Automatic capture detection
- Automatic scoring
- Timer/clock
- Chat between players
- Spectator mode
- Multiple concurrent games per player
