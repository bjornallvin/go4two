# Go4Two - Build Plan

## Phase 1: Project Setup

### 1.1 Initialize Next.js Project
- Create Next.js 14 app with App Router
- Configure TypeScript
- Set up Tailwind CSS
- Create folder structure

### 1.2 Supabase Setup
- Create Supabase project
- Run database migrations (games, moves tables)
- Enable Realtime on relevant tables
- Get connection credentials
- Set up environment variables

**Deliverable**: Empty Next.js app connected to Supabase

---

## Phase 2: Core Game Logic

### 2.1 Database Layer
- Create Supabase client configuration
- Create TypeScript types for Game and Move
- Create data access functions:
  - `createGame(boardSize)`
  - `getGameByCode(code)`
  - `joinGame(code, playerId)`
  - `makeMove(gameId, playerId, x, y)`
  - `passTurn(gameId, playerId)`
  - `resignGame(gameId, playerId)`

### 2.2 API Routes
- `POST /api/games` - Create game
- `GET /api/games/[code]` - Get game state
- `POST /api/games/[code]/join` - Join game
- `POST /api/games/[code]/move` - Make move
- `POST /api/games/[code]/pass` - Pass
- `POST /api/games/[code]/resign` - Resign

### 2.3 Player Identity
- Create hook `usePlayerId()` that generates/retrieves player ID from localStorage

**Deliverable**: Working API that can create games, join, and record moves

---

## Phase 3: Game Board UI

### 3.1 Board Component
- Render Go board with grid lines
- Support 9×9, 13×13, 19×19
- Draw star points (hoshi) at correct positions
- Make responsive (fit container)

### 3.2 Stone Component
- Black and white stone styles
- Subtle shadows/gradients for depth
- Positioned at grid intersections

### 3.3 Board State Rendering
- Fetch game state from API
- Render placed stones on board
- Highlight last move

**Deliverable**: Static board that displays game state

---

## Phase 4: Drag & Drop

### 4.1 Stone Supply
- Area showing stones available to place
- Draggable stone component

### 4.2 Drag Implementation
- Use `@dnd-kit/core` for drag-and-drop
- Calculate nearest intersection on drag
- Show ghost stone at snap position
- Validate drop (your turn, empty intersection)

### 4.3 Drop & API Call
- On valid drop, call move API
- Update local state optimistically
- Handle errors (revert if failed)

**Deliverable**: Functional drag-and-drop stone placement

---

## Phase 5: Real-time Sync

### 5.1 Supabase Realtime Setup
- Subscribe to game row changes
- Subscribe to new moves for game

### 5.2 State Synchronization
- Update board when opponent moves
- Update turn indicator
- Handle player join event (assign colors)

### 5.3 Connection Status
- Show connected/disconnected indicator
- Reconnect logic

**Deliverable**: Two-player real-time gameplay working

---

## Phase 6: Game Flow UI

### 6.1 Home Page
- Board size selector (9, 13, 19)
- "Create Game" button
- "Join Game" input (enter code manually)

### 6.2 Game Page
- Game board
- Turn indicator
- Player color display
- Share link button (copy to clipboard)
- Pass button
- Resign button
- Game status messages

### 6.3 Game States
- Waiting: Show "Waiting for opponent..." + share link
- Active: Normal gameplay
- Finished: Show result

**Deliverable**: Complete UI flow

---

## Phase 7: Polish

### 7.1 Styling
- Wood texture for board
- Nicer stone appearance
- Responsive design
- Loading states
- Error states

### 7.2 Mobile
- Test touch drag-and-drop
- Ensure board fits mobile screens
- Touch-friendly controls

### 7.3 Edge Cases
- Handle page refresh (rejoin game)
- Handle disconnect/reconnect
- Handle browser back button

**Deliverable**: Production-ready app

---

## Folder Structure

```
go4two/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Home page
│   ├── game/
│   │   └── [code]/
│   │       └── page.tsx         # Game page
│   └── api/
│       └── games/
│           ├── route.ts         # POST create game
│           └── [code]/
│               ├── route.ts     # GET game state
│               ├── join/
│               │   └── route.ts
│               ├── move/
│               │   └── route.ts
│               ├── pass/
│               │   └── route.ts
│               └── resign/
│                   └── route.ts
├── components/
│   ├── Board.tsx
│   ├── Stone.tsx
│   ├── DraggableStone.tsx
│   ├── DroppableBoard.tsx
│   ├── GameInfo.tsx
│   ├── GameControls.tsx
│   ├── ShareLink.tsx
│   └── ConnectionStatus.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── types.ts             # DB types
│   ├── game/
│   │   ├── actions.ts           # DB operations
│   │   └── utils.ts             # Game helpers
│   └── hooks/
│       ├── usePlayerId.ts
│       ├── useGame.ts
│       └── useRealtime.ts
├── public/
├── .env.local                   # Supabase credentials
└── package.json
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.1",
    "@dnd-kit/core": "^6",
    "nanoid": "^5"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/node": "^20",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

---

## Getting Started

1. **Set up Supabase project** at supabase.com
2. **Run this to initialize**:
   ```bash
   npx create-next-app@latest go4two --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
   cd go4two
   npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core nanoid
   ```
3. **Create `.env.local`** with Supabase credentials
4. **Run migrations** in Supabase SQL editor
5. **Start building** Phase 2

---

## Questions Before Starting

1. **Domain**: Do you have a domain in mind, or use Vercel's default?
2. **Supabase**: Do you have a Supabase account, or should we set one up?
3. **Game code format**: Short alphanumeric (e.g., `abc123`) or words (e.g., `happy-tiger-42`)?
