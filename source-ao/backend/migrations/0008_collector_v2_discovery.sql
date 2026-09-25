CREATE TABLE IF NOT EXISTS discovery_jobs (
  id TEXT PRIMARY KEY,
  search_run_id TEXT NOT NULL,
  supplier_id TEXT,
  provider TEXT NOT NULL DEFAULT 'known_supplier_web',
  query TEXT NOT NULL,
  source_url TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','running','completed','failed','skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY(search_run_id) REFERENCES search_runs(id) ON DELETE CASCADE,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  UNIQUE(search_run_id, supplier_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_discovery_jobs_pending
  ON discovery_jobs(status, priority ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_discovery_jobs_run
  ON discovery_jobs(search_run_id, status, priority ASC);

CREATE TABLE IF NOT EXISTS discovery_evidence (
  id TEXT PRIMARY KEY,
  discovery_job_id TEXT NOT NULL,
  search_run_id TEXT NOT NULL,
  supplier_id TEXT,
  source_url TEXT NOT NULL,
  fetch_status TEXT NOT NULL
    CHECK(fetch_status IN ('fetched','redirected','unsupported','failed')),
  http_status INTEGER,
  content_type TEXT,
  title TEXT,
  evidence_excerpt TEXT,
  match_score INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(discovery_job_id) REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(search_run_id) REFERENCES search_runs(id) ON DELETE CASCADE,
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_discovery_evidence_run
  ON discovery_evidence(search_run_id, match_score DESC, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_evidence_supplier
  ON discovery_evidence(supplier_id, fetched_at DESC);
