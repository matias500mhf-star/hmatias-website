PRAGMA foreign_keys = ON;

ALTER TABLE opportunities ADD COLUMN fit_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN fit_tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE opportunities ADD COLUMN discovery_source_id TEXT;

CREATE TABLE IF NOT EXISTS opportunity_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_kind TEXT NOT NULL DEFAULT 'html_index'
    CHECK(source_kind IN ('html_index','json_feed')),
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 50,
  scan_interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_checked_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opportunity_sources_scan
  ON opportunity_sources(active, priority ASC, last_checked_at ASC);

CREATE TABLE IF NOT EXISTS opportunity_candidates (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Angola',
  reference TEXT,
  published_at TEXT,
  deadline TEXT,
  source_url TEXT NOT NULL,
  scope_summary TEXT,
  evidence_excerpt TEXT,
  source_checked_at TEXT NOT NULL,
  opportunity_type TEXT NOT NULL DEFAULT 'tender',
  sector TEXT NOT NULL DEFAULT 'general',
  fit_score INTEGER NOT NULL DEFAULT 0,
  fit_tags_json TEXT NOT NULL DEFAULT '[]',
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','reviewed','rejected','promoted','duplicate')),
  promoted_opportunity_id TEXT,
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT,
  FOREIGN KEY(source_id) REFERENCES opportunity_sources(id) ON DELETE CASCADE,
  FOREIGN KEY(promoted_opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunity_candidates_queue
  ON opportunity_candidates(status, fit_score DESC, discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_candidates_deadline
  ON opportunity_candidates(deadline, status);

INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes
) VALUES(
  'sncp-public-procurement',
  'Portal da Contratação Pública — SNCP',
  'https://compraspublicas.minfin.gov.ao/ComprasPublicas',
  'html_index',
  1,
  10,
  60
);
