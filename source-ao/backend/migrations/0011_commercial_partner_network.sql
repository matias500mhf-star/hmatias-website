PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commercial_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'AO',
  partner_type TEXT NOT NULL
    CHECK(partner_type IN ('strategic_partner','supplier','subcontractor','service_provider','technical_partner','commercial_intermediary')),
  relationship_stage TEXT NOT NULL DEFAULT 'introduced'
    CHECK(relationship_stage IN ('introduced','under_review','approved','active','paused','archived')),
  source_channel TEXT NOT NULL DEFAULT 'manual'
    CHECK(source_channel IN ('whatsapp','email','document','manual')),
  locality TEXT,
  website TEXT,
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  sectors_json TEXT NOT NULL DEFAULT '[]',
  source_note TEXT,
  last_interaction_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commercial_partners_stage
  ON commercial_partners(relationship_stage,partner_type,name);

CREATE INDEX IF NOT EXISTS idx_commercial_partners_country
  ON commercial_partners(country_code,relationship_stage);

INSERT OR IGNORE INTO commercial_partners(
  id,name,country_code,partner_type,relationship_stage,source_channel,locality,website,capabilities_json,sectors_json,source_note
) VALUES
('partner-miliart','MILIART','AO','strategic_partner','under_review','document','Luanda','https://www.miliart-angola.com',
 '["interiors","furniture","office-furniture","partitions","vinyl-flooring","technical-flooring","metal-ceilings","acoustic-solutions","smart-home","decorative-surfaces","custom-kitchens","blinds-curtains"]',
 '["construction","interiors","facilities","hospitality","corporate-spaces"]',
 'Company presentation and meeting request received by HMATIAS.'),
('partner-mateana','MATEANA','AO','supplier','under_review','document','Luanda',NULL,
 '["uniforms","workwear","corporate-uniforms","construction-workwear","security-uniforms","hospitality-uniforms","healthcare-uniforms","sportswear"]',
 '["supply-procurement","construction","industry","security","hospitality","healthcare"]',
 'Company presentation received by HMATIAS.'),
('partner-premier-yangue','Premier Yangue','AO','strategic_partner','under_review','email','Luanda',NULL,
 '["recruitment","manpower","hr-outsourcing","payroll","immigration","work-permits","expatriate-mobilization","local-content","business-representation"]',
 '["human-resources","operations","construction-support","corporate-services"]',
 'Two-way cooperation proposal received by HMATIAS.'),
('partner-ady-ferraz','ADY-FERRAZ','AO','supplier','under_review','email','Luanda',NULL,
 '["ppe","epi","consumables","materials","equipment","sourcing","rfq-response"]',
 '["supply-procurement","construction","facilities","industrial"]',
 'Supplier cooperation and RFQ test proposal received by HMATIAS.'),
('partner-nova-forma','Nova Forma','AO','subcontractor','under_review','email','Luanda',NULL,
 '["construction","finishes","painting","remodelling","site-labour"]',
 '["construction","interiors","facilities"]',
 'Construction and finishes subcontracting proposal received by HMATIAS.'),
('partner-good-service','GOOD SERVICE','AO','subcontractor','introduced','whatsapp','Luanda',NULL,
 '["drywall","plasterboard","false-ceilings","painting","plastering","boiserie","wallpaper","interior-finishes","remodelling"]',
 '["construction","interiors","facilities"]',
 'Portfolio and immediate subcontracting availability presented to HMATIAS.'),
('partner-mendes-one','MENDES ONE','AO','service_provider','introduced','whatsapp','Luanda',NULL,
 '["cleaning","hygiene","sanitation","facility-cleaning","maintenance-support"]',
 '["cleaning-supplies","facilities","commercial-services","institutional-services"]',
 'Cleaning and hygiene partnership proposal received by HMATIAS.'),
('partner-construindo-futuro','Construindo O Futuro','AO','subcontractor','introduced','whatsapp','Luanda',NULL,
 '["wooden-doors","wooden-windows","joinery","installation","finishes"]',
 '["construction","interiors","building-finishes"]',
 'Supply and installation capability presented to HMATIAS.'),
('partner-redox-angola','Redox Angola','AO','supplier','active','whatsapp','Luanda','https://redoxangola.com',
 '["chemical-supply","industrial-chemicals","formaldehyde","reagents","stock-supply"]',
 '["supply-procurement","industrial","healthcare-supply"]',
 'Supplier already used in an active HMATIAS sourcing process.');
