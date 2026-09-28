PRAGMA foreign_keys = ON;

-- Official Angola-relevant opportunity feeds. Human review remains mandatory before public promotion.
INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,country_code,currency_code,adapter
) VALUES(
  'afdb-angola-specific-procurement',
  'African Development Bank — Angola Specific Procurement Notices',
  'https://www.afdb.org/en/documents/project-related-procurement/procurement-notices/specific-procurement-notices?field_keywords_tid=378&order=changed&sort=desc&tid=All&title=',
  'html_index',1,20,60,'AO','AOA','afdb_angola'
);

INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,country_code,currency_code,adapter
) VALUES(
  'afdb-angola-general-procurement',
  'African Development Bank — Angola General Procurement Notices',
  'https://www.afdb.org/en/documents/project-related-procurement/procurement-notices/general-procurement-notices?field_keywords_tid=378&order=changed&sort=desc&tid=All&title=',
  'html_index',1,25,180,'AO','AOA','afdb_angola'
);

INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,country_code,currency_code,adapter
) VALUES(
  'world-bank-angola-procurement',
  'World Bank — Angola Procurement Notices',
  'https://search.worldbank.org/api/v2/procnotices',
  'json_feed',1,15,60,'AO','AOA','world_bank_angola'
);

-- UNGM public notices are supported by the adapter, but the generic public search page
-- does not expose a stable unauthenticated Angola feed. Keep it registered but disabled
-- until an Angola-scoped endpoint is verified, instead of reporting a false live source.
INSERT OR IGNORE INTO opportunity_sources(
  id,name,source_url,source_kind,active,priority,scan_interval_minutes,country_code,currency_code,adapter
) VALUES(
  'ungm-angola-procurement',
  'United Nations Global Marketplace — Angola',
  'https://www.ungm.org/Public/Notice',
  'html_index',0,30,60,'AO','AOA','ungm_angola'
);
