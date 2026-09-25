CREATE TABLE IF NOT EXISTS search_runs (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  family_id TEXT,
  item_id TEXT,
  category TEXT,
  location TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'running'
    CHECK(status IN ('running','completed','failed')),
  query_variants_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  candidate_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_search_runs_created_at
  ON search_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_runs_normalized_query
  ON search_runs(normalized_query, location, created_at DESC);

CREATE TABLE IF NOT EXISTS search_candidates (
  id TEXT PRIMARY KEY,
  search_run_id TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  normalized_supplier_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  matched_variant TEXT,
  evidence_text TEXT,
  relevance_score INTEGER NOT NULL DEFAULT 0,
  discovery_status TEXT NOT NULL DEFAULT 'discovered'
    CHECK(discovery_status IN ('discovered','reviewed','rejected','promoted')),
  discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY(search_run_id) REFERENCES search_runs(id) ON DELETE CASCADE,
  UNIQUE(search_run_id, source_url, normalized_supplier_name)
);

CREATE INDEX IF NOT EXISTS idx_search_candidates_run_score
  ON search_candidates(search_run_id, relevance_score DESC, discovered_at ASC);

CREATE INDEX IF NOT EXISTS idx_search_candidates_status
  ON search_candidates(discovery_status, discovered_at DESC);

CREATE TABLE IF NOT EXISTS supplier_sources (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  search_candidate_id TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT,
  evidence_text TEXT,
  source_checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY(search_candidate_id) REFERENCES search_candidates(id) ON DELETE SET NULL,
  UNIQUE(source_url, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_sources_supplier
  ON supplier_sources(supplier_id, source_checked_at DESC);

CREATE TABLE IF NOT EXISTS search_gaps (
  id TEXT PRIMARY KEY,
  search_run_id TEXT NOT NULL UNIQUE,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT,
  family_id TEXT,
  reason TEXT NOT NULL DEFAULT 'no_candidate_found',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(search_run_id) REFERENCES search_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_search_gaps_created_at
  ON search_gaps(created_at DESC);
