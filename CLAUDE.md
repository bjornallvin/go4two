# Go4Two

Multiplayer Go board game with real-time cursor sharing.

## Commands

```bash
npm run dev        # Next.js on :3000
npm run dev:party  # PartyKit on :1999
npm run dev:all    # Both servers concurrently
npm run build      # Production build
npm run deploy:party  # Deploy PartyKit to production
```

## Architecture

- **Frontend**: Next.js 14 App Router, React, TypeScript, Tailwind CSS
- **Database**: Direct Postgres via `pg` (not Supabase client) - all DB operations are server-side only
- **Real-time**: PartyKit WebSockets for bidirectional cursor position broadcasting
- **Hosting**: Vercel (Next.js) + PartyKit

## Project Structure

```
app/
  page.tsx                    # Home - create/join game
  game/[code]/page.tsx        # Game page with real-time play
  api/games/                  # REST endpoints for game actions
components/
  DroppableBoard.tsx          # Main board with drag-drop logic
  Board.tsx                   # Go board grid rendering
  Stone.tsx                   # Stone component with gradients
  GameControls.tsx            # Pass/Resign buttons
  GameInfo.tsx                # Turn indicator, player colors
  ShareLink.tsx               # Copy link to clipboard
lib/
  db.ts                       # Postgres connection pool
  types.ts                    # Game, Move, PlayerColor types
  game/actions.ts             # All database operations
  hooks/
    useGame.ts                # Game state management
    usePlayerId.ts            # Player ID via localStorage
    usePartySocket.ts         # WebSocket for cursor sync
party/
  index.ts                    # PartyKit server - cursor broadcasts
supabase/
  migrations/001_initial.sql  # Database schema
```

## Key Patterns

- Server-side only database access (no public env vars)
- Real-time cursor positions broadcast via PartyKit room per game
- Custom drag-drop with snap threshold (40% of cell size)
- Board sizes: 9x9, 13x13, 19x19 with dynamic cell sizing
- No automatic rule enforcement - manual captures/scoring

## Environment Variables

```
DATABASE_URL=postgresql://...  # Postgres connection string
NEXT_PUBLIC_PARTYKIT_HOST=...  # PartyKit host (localhost:1999 for dev)
```

## Database

Schema in `supabase/migrations/001_initial.sql`. Tables: `games`, `moves`.

To run migrations with psql, URL-encode special characters in password (e.g., `@` becomes `%40`).
