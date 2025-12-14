# Go4Two

A multiplayer Go board game. Create a game, share the link with a friend, and play together in real-time.

## Features

- **Multiplayer** - Create a game and share the link with your opponent
- **Real-time cursors** - See your opponent's cursor as they drag stones
- **Board sizes** - 9×9, 13×13, or 19×19
- **Drag & drop** - Smooth stone placement with snap-to-grid
- **Rule enforcement** - Automatic capture detection, ko rule, and suicide prevention
- **Territory scoring** - Live score calculation with territory visualization
- **Chat & reactions** - Send messages and emoji reactions during the game
- **Voice chat** - Talk to your opponent with WebRTC audio
- **Sound notifications** - Audio cues for moves and your turn
- **Stone animations** - Smooth fade-in for placements, fade-out for captures

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Database:** Postgres (via Supabase)
- **Real-time:** PartyKit (WebSockets for cursors, chat, reactions, voice signaling)
- **Game engine:** Tenuki (Go rules, captures, territory)
- **Hosting:** Vercel + PartyKit

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- A PartyKit account (free tier works)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/bjornallvin/go4two.git
   cd go4two
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database - run this SQL in your Supabase SQL Editor:
   ```sql
   -- See supabase/migrations/001_initial.sql
   ```

4. Create `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
   ```

5. Run both servers:
   ```bash
   npm run dev:all
   ```

   Or separately:
   ```bash
   npm run dev        # Next.js on :3000
   npm run dev:party  # PartyKit on :1999
   ```

6. Open http://localhost:3000

## Deployment

### PartyKit

```bash
npm run deploy:party
```

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `DATABASE_URL` - Supabase connection string
   - `NEXT_PUBLIC_PARTYKIT_HOST` - Your PartyKit URL (e.g., `go4two.username.partykit.dev`)

## How to Play

1. Create a game and select board size
2. Share the link with your opponent
3. Colors are assigned randomly when both players join
4. Black plays first
5. Drag stones from the supply or tap on the board to place
6. Captures are detected automatically
7. Live scores update after each move (tap the score for breakdown)
8. Use "Show Territory" to visualize territory on the board
9. Pass twice to end the game and see final scores
10. Use chat and emoji reactions to communicate

## License

MIT
