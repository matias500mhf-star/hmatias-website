PRAGMA foreign_keys = ON;

-- Schema only. Priorities, interaction timestamps and next actions are private
-- operational data and must be maintained through the authenticated admin API
-- / private database rather than embedded in public repository history.
ALTER TABLE commercial_partners ADD COLUMN commercial_priority INTEGER NOT NULL DEFAULT 3
  CHECK(commercial_priority BETWEEN 1 AND 5);
ALTER TABLE commercial_partners ADD COLUMN next_action TEXT;
ALTER TABLE commercial_partners ADD COLUMN next_action_due TEXT;

CREATE INDEX IF NOT EXISTS idx_commercial_partners_priority
  ON commercial_partners(commercial_priority DESC,relationship_stage,name);
