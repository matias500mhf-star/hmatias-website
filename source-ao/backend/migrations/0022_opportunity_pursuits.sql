PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS opportunity_pursuits (
  opportunity_id TEXT PRIMARY KEY,
  decision TEXT NOT NULL DEFAULT 'watch'
    CHECK(decision IN ('watch','go','no_go')),
  stage TEXT NOT NULL DEFAULT 'review'
    CHECK(stage IN ('review','qualification','partnering','preparing_bid','submitted','clarification','won','lost','withdrawn')),
  owner TEXT,
  estimated_value_aoa REAL,
  next_action TEXT,
  next_action_due_at TEXT,
  partner_need TEXT,
  notes TEXT,
  outcome_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opportunity_pursuits_pipeline
  ON opportunity_pursuits(decision, stage, next_action_due_at, updated_at DESC);
