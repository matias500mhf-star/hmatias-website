PRAGMA foreign_keys = ON;

ALTER TABLE commercial_partners ADD COLUMN commercial_priority INTEGER NOT NULL DEFAULT 3
  CHECK(commercial_priority BETWEEN 1 AND 5);
ALTER TABLE commercial_partners ADD COLUMN next_action TEXT;
ALTER TABLE commercial_partners ADD COLUMN next_action_due TEXT;

UPDATE commercial_partners SET
  commercial_priority=5,
  last_interaction_at='2026-09-26T00:00:00Z',
  next_action='Agendar a reunião proposta e definir categorias prioritárias, tempos de resposta a RFQs, instalação, garantias e responsáveis comerciais.'
WHERE id='partner-miliart';

UPDATE commercial_partners SET
  commercial_priority=4,
  next_action='Solicitar catálogo comercial, gamas de fardamento, prazos, mínimos, personalização, condições e base de preços para futuros RFQs.'
WHERE id='partner-mateana';

UPDATE commercial_partners SET
  commercial_priority=4,
  last_interaction_at='2026-09-23T00:00:00Z',
  next_action='Trocar portefólios e identificar a primeira oportunidade concreta de referral, manpower, imigração, procurement ou execução local.'
WHERE id='partner-premier-yangue';

UPDATE commercial_partners SET
  commercial_priority=5,
  next_action='Enviar um RFQ teste de pequeno lote para validar resposta, conformidade técnica, preço, prazo e capacidade de sourcing.'
WHERE id='partner-ady-ferraz';

UPDATE commercial_partners SET
  commercial_priority=4,
  last_interaction_at='2026-09-26T00:00:00Z',
  next_action='Concluir pré-qualificação: portefólio, capacidade operacional e documentos disponíveis para subempreitadas de construção e acabamentos.'
WHERE id='partner-nova-forma';

UPDATE commercial_partners SET
  commercial_priority=4,
  last_interaction_at='2026-09-21T09:32:05Z',
  next_action='Pré-qualificar equipa, portefólio e disponibilidade para pintura, pladur, tetos falsos, remodelação e acabamentos.'
WHERE id='partner-good-service';

UPDATE commercial_partners SET
  commercial_priority=3,
  last_interaction_at='2026-09-23T09:53:33Z',
  next_action='Solicitar capacidade operacional, equipamentos, cobertura e modalidade de preços para reforço de HMATIAS Clean e Facilities.'
WHERE id='partner-mendes-one';

UPDATE commercial_partners SET
  commercial_priority=3,
  last_interaction_at='2026-09-22T11:07:05Z',
  next_action='Solicitar catálogo, base de preços, prazos e capacidade de instalação de portas e janelas de madeira.'
WHERE id='partner-construindo-futuro';

UPDATE commercial_partners SET
  commercial_priority=5,
  last_interaction_at='2026-09-23T11:55:12Z',
  next_action='Dar seguimento ao processo comercial ativo e manter validação documental, disponibilidade, preço final, transporte e condições antes da compra.'
WHERE id='partner-redox-angola';

INSERT OR IGNORE INTO commercial_partners(
  id,name,country_code,partner_type,relationship_stage,source_channel,locality,website,
  capabilities_json,sectors_json,source_note,last_interaction_at,commercial_priority,next_action
) VALUES(
  'partner-muxi-tracker',
  'MUXI-TRACKER GPS',
  'AO',
  'service_provider',
  'introduced',
  'whatsapp',
  'Luanda',
  NULL,
  '["fleet-gps","vehicle-tracking","gps-maintenance","telematics"]',
  '["fleet","logistics","facilities","security"]',
  'Fleet GPS and technical support proposal received by HMATIAS.',
  '2026-09-22T12:16:38Z',
  2,
  'Manter na rede para necessidades de frota ou clientes com GPS sem suporte; sem ação comercial imediata.'
);

CREATE INDEX IF NOT EXISTS idx_commercial_partners_priority
  ON commercial_partners(commercial_priority DESC,relationship_stage,name);
