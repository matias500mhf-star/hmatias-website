-- Exclude only the internal, deterministic production smoke RFQ from notification
-- generation. Do not suppress genuine customer requests or partner applications.
-- Synthetic validation requests remain closed in the commercial record for audit.
DROP TRIGGER IF EXISTS queue_sourcing_request_alert;

CREATE TRIGGER queue_sourcing_request_alert
AFTER INSERT ON sourcing_requests
WHEN NOT (
  NEW.requirement_text = 'VALIDAÇÃO RFQ — PEDIDO SINTÉTICO, NÃO PROCESSAR'
  AND NEW.contact_hint = 's***@example.invalid'
)
BEGIN
  INSERT OR IGNORE INTO intake_alerts(id,source_type,source_id,reference)
  VALUES('alert_sr_'||NEW.id,'sourcing_request',NEW.id,NEW.public_ref);
END;

-- Remove only undelivered alerts attached to closed internal smoke RFQs.
-- Never delete real sourcing records or previously provider-accepted alerts.
DELETE FROM intake_alerts
WHERE source_type = 'sourcing_request'
  AND state = 'pending'
  AND source_id IN (
    SELECT id
    FROM sourcing_requests
    WHERE requirement_text = 'VALIDAÇÃO RFQ — PEDIDO SINTÉTICO, NÃO PROCESSAR'
      AND contact_hint = 's***@example.invalid'
      AND status = 'closed'
  );
