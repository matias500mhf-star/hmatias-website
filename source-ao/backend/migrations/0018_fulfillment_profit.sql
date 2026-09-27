PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_fulfillment_cases (
  request_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL DEFAULT 'pending'
    CHECK(stage IN ('pending','awarded','purchased','delivered','completed')),
  award_ref TEXT,
  awarded_at TEXT,
  purchase_ref TEXT,
  purchased_at TEXT,
  actual_material_cost_aoa REAL CHECK(actual_material_cost_aoa IS NULL OR actual_material_cost_aoa >= 0),
  actual_transport_cost_aoa REAL CHECK(actual_transport_cost_aoa IS NULL OR actual_transport_cost_aoa >= 0),
  actual_customs_cost_aoa REAL CHECK(actual_customs_cost_aoa IS NULL OR actual_customs_cost_aoa >= 0),
  actual_tax_cost_aoa REAL CHECK(actual_tax_cost_aoa IS NULL OR actual_tax_cost_aoa >= 0),
  actual_other_cost_aoa REAL CHECK(actual_other_cost_aoa IS NULL OR actual_other_cost_aoa >= 0),
  delivery_ref TEXT,
  delivered_at TEXT,
  final_revenue_aoa REAL CHECK(final_revenue_aoa IS NULL OR final_revenue_aoa >= 0),
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sourcing_fulfillment_stage
  ON sourcing_fulfillment_cases(stage, updated_at DESC);
