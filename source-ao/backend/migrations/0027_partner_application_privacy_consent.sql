PRAGMA foreign_keys = ON;

-- Store affirmative consent metadata for every newly submitted partner application.
-- Existing rows remain nullable because consent history cannot be reconstructed retroactively.
ALTER TABLE partner_applications ADD COLUMN privacy_consent_at TEXT;
ALTER TABLE partner_applications ADD COLUMN privacy_notice_version TEXT;
