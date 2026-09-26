-- Source AO STAGING ONLY
-- Synthetic supplier used for end-to-end confirmation tests.
-- Never import this file into production.

INSERT OR REPLACE INTO suppliers (
  id,name,legal_name,location,website,public_status,last_verified_at
) VALUES (
  'sup_test_staging',
  'SOURCE AO STAGING TEST SUPPLIER',
  'Synthetic test record — not a real company',
  'Luanda, Angola',
  NULL,
  'source_checked',
  '2026-09-22T16:00:00Z'
);
