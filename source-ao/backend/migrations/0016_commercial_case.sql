PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_cost_options (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  supplier_quote_ref TEXT,
  currency TEXT NOT NULL DEFAULT 'AOA',
  material_cost REAL NOT NULL DEFAULT 0 CHECK(material_cost >= 0),
  transport_cost REAL NOT NULL DEFAULT 0 CHECK(transport_cost >= 0),
  customs_cost REAL NOT NULL DEFAULT 0 CHECK(customs_cost >= 0),
  tax_cost REAL NOT NULL DEFAULT 0 CHECK(tax_cost >= 0),
  other_cost REAL NOT NULL DEFAULT 0 CHECK(other_cost >= 0),
  contingency_cost REAL NOT NULL DEFAULT 0 CHECK(contingency_cost >= 0),
  fx_rate_to_aoa REAL CHECK(fx_rate_to_aoa IS NULL OR fx_rate_to_aoa > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','verified','selected','rejected','expired')),
  cost_verified_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(supplier_id) REFERENCES private_sourcing_suppliers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sourcing_cost_options_request
  ON sourcing_cost_options(request_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sourcing_cost_options_supplier
  ON sourcing_cost_options(supplier_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS sourcing_commercial_cases (
  request_id TEXT PRIMARY KEY,
  qualification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK(qualification_status IN ('pending','qualified','needs_info','declined')),
  selected_supplier_id TEXT,
  selected_cost_option_id TEXT,
  sale_price_aoa REAL CHECK(sale_price_aoa IS NULL OR sale_price_aoa >= 0),
  proposal_status TEXT NOT NULL DEFAULT 'not_ready'
    CHECK(proposal_status IN ('not_ready','ready','sent','revised','accepted','rejected','expired')),
  proposal_ref TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(selected_supplier_id) REFERENCES private_sourcing_suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY(selected_cost_option_id) REFERENCES sourcing_cost_options(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sourcing_commercial_cases_status
  ON sourcing_commercial_cases(qualification_status, proposal_status, updated_at DESC);
