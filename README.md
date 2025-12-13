# Go4Two

A simple multiplayer Go board game. Create a game, share the link with a friend, and play together in real-time.

**Live demo:** https://go4two.vercel.app

## Features

- **Multiplayer** - Create a game and share the link with your opponent
- **Real-time** - See your opponent's cursor as they drag stones
- **Board sizes** - 9×9, 13×13, or 19×19
- **Drag & drop** - Smooth stone placement with snap-to-grid
- **No rules enforced** - Manual gameplay, you decide captures and scoring

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Database:** Supabase Postgres
- **Real-time:** PartyKit (WebSockets)
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
5. Drag stones from the supply or click on the board to place
6. Use Pass/Resign buttons as needed
7. Agree on captures and scoring manually (no automatic rules)

## License

MIT
