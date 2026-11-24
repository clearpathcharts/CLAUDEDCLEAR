CREATE TABLE IF NOT EXISTS member_preferences (
  viewer_sub TEXT PRIMARY KEY,
  preferred_desk TEXT NOT NULL DEFAULT 'retail',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id BIGSERIAL PRIMARY KEY,
  viewer_sub TEXT NOT NULL,
  symbol TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (viewer_sub, symbol)
);

CREATE INDEX IF NOT EXISTS watchlist_items_viewer_idx ON watchlist_items (viewer_sub);
