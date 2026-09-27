-- Scope correction: Namibia and South Africa are regional material sourcing only.
-- Opportunity intelligence remains Angola-only.
UPDATE opportunity_sources
SET active=0,
    updated_at=CURRENT_TIMESTAMP
WHERE country_code IN ('NA','ZA');

-- Preserve discovered records for audit, but remove unreviewed foreign tender candidates
-- from the actionable opportunity queue.
UPDATE opportunity_candidates
SET status='rejected'
WHERE country_code IN ('NA','ZA')
  AND status='pending';
