-- Source AO intake delivery queue: atomic tracking of new business requests.
-- No requester PII in this table, no external delivery assumed.
CREATE TABLE IF NOT EXISTS intake_alerts (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('sourcing_request','partner_application')),
  source_id TEXT NOT NULL,
  reference TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sent')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_type,source_id)
);
CREATE INDEX IF NOT EXISTS idx_intake_alerts_retry ON intake_alerts(state,next_attempt_at,created_at);
CREATE TRIGGER IF NOT EXISTS queue_sourcing_request_alert AFTER INSERT ON sourcing_requests
BEGIN
  INSERT OR IGNORE INTO intake_alerts(id,source_type,source_id,reference)
  VALUES('alert_sr_'||NEW.id,'sourcing_request',NEW.id,NEW.public_ref);
END;
CREATE TRIGGER IF NOT EXISTS queue_partner_application_alert AFTER INSERT ON partner_applications
BEGIN
  INSERT OR IGNORE INTO intake_alerts(id,source_type,source_id,reference)
  VALUES('alert_pa_'||NEW.id,'partner_application',NEW.id,NEW.reference);
END;
