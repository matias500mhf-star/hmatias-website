CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  location TEXT,
  service_type TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','quoted','won','lost')),
  source TEXT NOT NULL DEFAULT 'website_business_services',
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt','en')),
  privacy_consent INTEGER NOT NULL DEFAULT 1 CHECK (privacy_consent = 1),
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending','sent','failed')),
  confirmation_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (confirmation_status IN ('pending','sent','failed','not_applicable')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_service_type ON leads(service_type);

CREATE TABLE IF NOT EXISTS lead_rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_lead_rate_limits_updated_at ON lead_rate_limits(updated_at);
