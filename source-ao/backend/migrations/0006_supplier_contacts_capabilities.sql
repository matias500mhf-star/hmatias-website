ALTER TABLE suppliers ADD COLUMN capabilities_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE suppliers ADD COLUMN phone TEXT;
ALTER TABLE suppliers ADD COLUMN whatsapp TEXT;
ALTER TABLE suppliers ADD COLUMN email TEXT;
