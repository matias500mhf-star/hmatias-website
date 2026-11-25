-- Firebase-backed customer/supplier identity mapping.
-- No email, phone or display name is persisted here; Firebase remains the identity provider.
CREATE TABLE IF NOT EXISTS firebase_identities (
  uid TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK(role IN ('customer','supplier','hm_operator')),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firebase_identities_role
  ON firebase_identities(role, updated_at);

CREATE TABLE IF NOT EXISTS firebase_identity_role_changes (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES firebase_identities(uid),
  previous_role TEXT NOT NULL,
  next_role TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sourcing_requests ADD COLUMN firebase_uid TEXT;
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_firebase_uid
  ON sourcing_requests(firebase_uid, created_at DESC);
