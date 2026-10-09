"""Regression test: synthetic production RFQs must never inflate the intake outbox."""
import sqlite3
from pathlib import Path

MIGRATIONS = Path(__file__).resolve().parent.parent / "migrations"
SYNTHETIC = "VALIDAÇÃO RFQ — PEDIDO SINTÉTICO, NÃO PROCESSAR"
HINT = "s***@example.invalid"

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE sourcing_requests(
  id TEXT PRIMARY KEY,
  public_ref TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  contact_hint TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE partner_applications(id TEXT PRIMARY KEY,reference TEXT NOT NULL);
""")
db.executescript((MIGRATIONS / "0023_intake_alert_queue.sql").read_text(encoding="utf8"))

def add_request(id_, requirement, hint, status="received"):
    db.execute(
        "INSERT INTO sourcing_requests(id,public_ref,requirement_text,contact_hint,status) VALUES(?,?,?,?,?)",
        (id_, "SAO-TEST-" + id_, requirement, hint, status)
    )

def pending_ids():
    return {
        row[0] for row in db.execute(
            "SELECT source_id FROM intake_alerts WHERE state='pending' AND source_type='sourcing_request'"
        )
    }

add_request("test-closed", SYNTHETIC, HINT, "closed")
add_request("real-existing", "Cinta PP 9 mm", "c***@empresa.example")
assert pending_ids() == {"test-closed", "real-existing"}

db.executescript((MIGRATIONS / "0025_exclude_synthetic_smoke_alerts.sql").read_text(encoding="utf8"))
assert pending_ids() == {"real-existing"}, "Migration must remove only closed synthetic alerts"

add_request("test-new", SYNTHETIC, HINT)
add_request("real-new", "Capacete EPI", "e***@empresa.example")
assert pending_ids() == {"real-existing", "real-new"}, "Only business RFQs must queue"

db.execute(
    "INSERT INTO partner_applications(id,reference) VALUES(?,?)",
    ("partner-real", "PARTNER-TEST")
)
assert db.execute(
    "SELECT COUNT(*) FROM intake_alerts WHERE source_type='partner_application'"
).fetchone()[0] == 1, "Partner alerts must continue to queue"

# User-submitted requirements may contain the synthetic marker accidentally.
# Matching the text without the internal test-only contact does not skip delivery.
add_request("real-marker", SYNTHETIC, "a***@real-client.example")
assert "real-marker" in pending_ids()

print("PASS: synthetic smoke outbox excluded; real RFQs and partner applications preserved")
