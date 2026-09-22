PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS rate_limit_windows (
  bucket TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (bucket, client_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_updated
  ON rate_limit_windows(updated_at);
