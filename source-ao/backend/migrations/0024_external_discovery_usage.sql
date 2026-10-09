-- Protect paid AI/search integrations from unbounded requests.
-- The record contains only aggregate daily request counts; no supplier or client data.
CREATE TABLE IF NOT EXISTS external_discovery_usage (
  day TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0 CHECK(requests>=0)
);
