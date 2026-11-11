PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_status_events (
  id TEXT PRIMARY KEY,
  sourcing_request_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sourcing_request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sourcing_status_events_request
  ON sourcing_status_events(sourcing_request_id, created_at);

CREATE TABLE IF NOT EXISTS sourcing_workflow_runs (
  id TEXT PRIMARY KEY,
  sourcing_request_id TEXT NOT NULL,
  status TEXT NOT NULL,
  result_encrypted TEXT,
  error_code TEXT,
  requested_by TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(sourcing_request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sourcing_workflow_runs_request
  ON sourcing_workflow_runs(sourcing_request_id, started_at);
