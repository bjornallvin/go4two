-- Go4Two Database Schema
-- Run this in your Supabase SQL Editor

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL,
  board_size INTEGER NOT NULL DEFAULT 19,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  current_turn VARCHAR(10) DEFAULT 'black',
  black_player_id VARCHAR(50),
  white_player_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moves table
CREATE TABLE IF NOT EXISTS moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_color VARCHAR(10) NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  move_number INTEGER NOT NULL,
  move_type VARCHAR(10) NOT NULL DEFAULT 'place',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_code ON games(code);
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_game_position ON moves(game_id, x, y);
