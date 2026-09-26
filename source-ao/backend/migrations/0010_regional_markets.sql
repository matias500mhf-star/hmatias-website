PRAGMA foreign_keys = ON;

ALTER TABLE opportunities ADD COLUMN country_code TEXT NOT NULL DEFAULT 'AO';
ALTER TABLE opportunities ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'AOA';

ALTER TABLE opportunity_sources ADD COLUMN country_code TEXT NOT NULL DEFAULT 'AO';
ALTER TABLE opportunity_sources ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'AOA';
ALTER TABLE opportunity_sources ADD COLUMN adapter TEXT NOT NULL DEFAULT 'generic';

ALTER TABLE opportunity_candidates ADD COLUMN country_code TEXT NOT NULL DEFAULT 'AO';
ALTER TABLE opportunity_candidates ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'AOA';

UPDATE opportunities SET country_code='AO',currency_code='AOA'
WHERE country_code IS NULL OR country_code='' OR currency_code IS NULL OR currency_code='';

UPDATE opportunity_candidates SET country_code='AO',currency_code='AOA'
WHERE country_code IS NULL OR country_code='' OR currency_code IS NULL OR currency_code='';

UPDATE opportunity_sources
SET country_code='AO',currency_code='AOA',adapter='sncp_angola'
WHERE id='sncp-public-procurement';

INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,
  country_code,currency_code,adapter
) VALUES(
  'cpbn-namibia-open-bids',
  'Central Procurement Board of Namibia — Open Bids',
  'https://www.cpbn.com.na/index/external/2',
  'html_index',
  1,
  20,
  60,
  'NA',
  'NAD',
  'cpbn_namibia'
);

INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,
  country_code,currency_code,adapter
) VALUES(
  'etenders-south-africa-ocds',
  'South Africa National Treasury — eTenders OCDS',
  'https://ocds-api.etenders.gov.za/api/OCDSReleases',
  'json_feed',
  1,
  30,
  60,
  'ZA',
  'ZAR',
  'ocds_etenders_za'
);

CREATE INDEX IF NOT EXISTS idx_opportunities_country_deadline
  ON opportunities(country_code,status,deadline);

CREATE INDEX IF NOT EXISTS idx_opportunity_candidates_country_queue
  ON opportunity_candidates(country_code,status,fit_score DESC,discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_sources_country_scan
  ON opportunity_sources(country_code,active,priority ASC,last_checked_at ASC);
