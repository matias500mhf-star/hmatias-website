"""Validate institutional lead isolation and database constraints before release."""
from pathlib import Path
import sqlite3

migration=Path(__file__).resolve().parent.parent/"migrations"/"0026_website_leads.sql"
db=sqlite3.connect(":memory:")
db.executescript(migration.read_text(encoding="utf8"))
tables={row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert "website_leads" in tables
assert "sourcing_requests" not in tables, "Migration must not mutate sourcing database tables"

args=("wl_1","HM-20261009-TEST0001","nonce-a","payload-a","contact","Construção","encrypted:example")
db.execute("""INSERT INTO website_leads
(id,reference,submission_hash,payload_hash,kind,service,encrypted_payload)
VALUES(?,?,?,?,?,?,?)""",args)
row=db.execute("SELECT alert_state,status FROM website_leads WHERE id='wl_1'").fetchone()
assert row==("pending","received")

try:
    db.execute("""INSERT INTO website_leads
    (id,reference,submission_hash,payload_hash,kind,service,encrypted_payload)
    VALUES(?,?,?,?,?,?,?)""",("wl_2","HM-20261009-TEST0002","nonce-a","payload-b","contact","Facilities","encrypted"))
    raise AssertionError("Duplicate nonce should be rejected")
except sqlite3.IntegrityError:
    pass
try:
    db.execute("UPDATE website_leads SET status='awarded' WHERE id='wl_1'")
    raise AssertionError("Institutional status should never accept sourcing-only pipeline values")
except sqlite3.IntegrityError:
    pass
db.execute("UPDATE website_leads SET status='triage' WHERE id='wl_1'")
assert db.execute("SELECT status FROM website_leads WHERE id='wl_1'").fetchone()[0]=="triage"
print("PASS: institutional intake migration isolated, idempotent and status-constrained")
