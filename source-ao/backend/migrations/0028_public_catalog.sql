PRAGMA foreign_keys = ON;

-- Separate curated public visibility from the private/admin catalog.
-- Newly created items remain private until an administrator explicitly publishes them.
ALTER TABLE items ADD COLUMN name_pt TEXT;
ALTER TABLE items ADD COLUMN keywords_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE items ADD COLUMN public_visible INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_items_public_catalog
  ON items(public_visible, category, name);
