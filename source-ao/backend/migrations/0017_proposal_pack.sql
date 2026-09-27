PRAGMA foreign_keys = ON;

ALTER TABLE sourcing_commercial_cases ADD COLUMN proposal_validity_days INTEGER
  CHECK(proposal_validity_days IS NULL OR (proposal_validity_days BETWEEN 1 AND 365));
ALTER TABLE sourcing_commercial_cases ADD COLUMN proposal_payment_terms TEXT;
ALTER TABLE sourcing_commercial_cases ADD COLUMN proposal_delivery_terms TEXT;
ALTER TABLE sourcing_commercial_cases ADD COLUMN proposal_tax_treatment TEXT;
ALTER TABLE sourcing_commercial_cases ADD COLUMN proposal_customer_notes TEXT;
