# HMATIAS — registo persistente de pedidos do website (09/10/2026)

## Objetivo e estado
Implementar uma via segura de registo dos formulários institucionais sem depender exclusivamente do WhatsApp. O fluxo utiliza a **infraestrutura já operativa** do Worker/D1 Source AO, mas guarda leads em `website_leads`, separados dos RFQs de procurement.

**Estado inicial: bloqueado por feature flag** `WEBSITE_LEAD_INTAKE_ENABLED` (ausente ou diferente de `true`). Nunca publicar como operante apenas por passar num PR.

## Fluxo
1. Formulários de contacto, Business Services e agendamento (PT/EN) consultam `GET /api/website-leads/config`. Sem sinal de backend pronto, mantêm a experiência atual WhatsApp/e-mail.
2. Quando a flag é ativada e os pré-requisitos verificados, o browser mostra consentimento e aceita submissão por `POST /api/website-leads`, com limite de 4 tentativas/10 min/identificador anónimo.
3. O servidor exige domínio autorizado, JSON com campos de tamanho limitado, identificador aleatório e consentimento explícito. Deteta honeypot, valida contacto e usa hash de nonce para idempotência.
4. Dados pessoais são encriptados em D1 antes da gravação. A referência `HM-AAAAMMDD-XXXXXXXX` significa **persistência confirmada**, não e-mail enviado.
5. Pessoal autenticado consulta `/source-ao/website-leads.html`, pode abrir detalhes e atualizar estado (recebido/em análise/respondido/encerrado). A credencial existe apenas em memória de sessão.
6. O cron envia alertas internos via Resend **apenas quando** as credenciais do Worker estão configuradas. Regista `accepted` somente após aceitação HTTP do provedor, sem afirmar entrega na caixa. Em falhas mantém `pending` e faz retry com backoff.
7. Dados operacionais expiram após no máximo 180 dias, via rotina diária, exceto outros registos conservados por obrigações legais fora desta tabela.

## URLs e fronteiras
- Público: `GET /api/website-leads/config`, `OPTIONS /api/website-leads`, `POST /api/website-leads`.
- Protegido: `GET /api/admin/website-leads`, `GET /api/admin/website-leads/:id`, `POST /api/admin/website-leads/:id/status`.
- Painel interno operacional: `https://source-ao-api.matias500-mhf.workers.dev/internal/website-leads` (servido pelo Worker, noindex e sem quaisquer dados antes da autenticação).
- O ficheiro fonte `/source-ao/website-leads.html` é excluído do artefacto público GitHub Pages; não é uma ligação pública de consulta.
- Nenhum dos endpoints expõe API keys ou dados pessoais sem autenticação administrativa.

## Validações obrigatórias antes da ativação
- [ ] CI verde: `npm run check` no backend, `website-leads.test.mjs`, validação das páginas PT/EN e JavaScript raiz.
- [ ] Aplicar a migração D1 `0026_website_leads.sql` e verificar tabela/índices, sem tocar nas tabelas de RFQ.
- [ ] Atualizar política de privacidade e consentimento nos dois idiomas.
- [ ] Confirmar que a lista privada abre somente com token válido e que nenhum contacto aparece em respostas públicas ou logs.
- [ ] Fazer POST de teste autorizado no staging, repetir a mesma submissão e confirmar mesma referência. Alterar payload com o mesmo nonce deve falhar HTTP 409.
- [ ] Simular desconexão, timeout, endereço externo e rate-limit: nenhuma interface deverá afirmar que o pedido foi recebido sem confirmação da D1.
- [ ] Inspecionar layout e acessibilidade em Android/iPhone/desktop e confirmar que WhatsApp e e-mail continuam utilizáveis.
- [ ] Validar aceitação Resend, receção no email oficial, reprocessamento sem duplicados e despacho do responsável comercial.
- [ ] **Só então** definir `WEBSITE_LEAD_INTAKE_ENABLED=true` na configuração do Worker de produção, mantendo limite de rate e monitorização.

## Distinção operacional
Pedidos recebidos em D1 ≠ notificações aceites pela Resend ≠ mensagens entregues ≠ propostas emitidas ≠ contratos fechados.

A integração com HubSpot será uma fase seguinte. Não criar um CRM fictício nem deixar a ausência de HubSpot bloquear a persistência interna de leads.
