# HMATIAS — Auditoria integral dos formulários, assistente e Source AO
Data de revisão: 09/10/2026  
Âmbito: website institucional HMATIAS PT/EN e páginas públicas/privadas Source AO.

## Diagnóstico (código do repositório, não uma confirmação de produção)
| Entrada | Ficheiros | Funcionamento encontrado | Garantia de registo | Prioridade |
|---|---|---|---|---|
| Home/PT + EN | `index.html`, `en.html`, `script.js` | Formulário prepara e abre WhatsApp; só o visitante pode enviar | **Não**, sem backend | Crítica |
| Business Services PT + EN | `servicos-administrativos.html`, `business-services.html`, `script.js` | Prepara e abre WhatsApp | **Não** | Crítica |
| Agendamento PT + EN | `agendamento.html`, `booking.html`, `script.js` | Prepara WhatsApp; data não é confirmada | **Não** | Alta |
| Smart RFQ institucional PT + EN | `rfq.html`, `rfq-en.html`, `rfq.js` | Gera briefing local, links mailto/WhatsApp e cópia | **Não** | Crítica |
| Supply PT + EN | `supply.html`, `supply-en.html`, `supply-request.js` | Preparação de pedido e abertura de WhatsApp | **Não**, mas agora há acesso ao RFQ persistente do Source AO | Crítica |
| HMATIAS Clean PT + EN | `clean.html`, `clean-en.html`, `clean-store.js` | Carrinho e formulário geram mensagem WhatsApp | **Não** | Alta |
| Source AO pesquisa | `source-ao/index.html`, `sourceao.js`, `data-engine.js`, `verified-results.js`, Worker | Consulta índice curado, evidência técnica e endpoint privado; não percorre toda a Internet em tempo real | Pesquisa não implica lead | Crítica |
| Source AO pedido rápido | `source-ao/index.html`, `sourcing-ui.js`, API `/api/sourcing-requests` | POST privado com referência SAO e link de acompanhamento. Original misturava quantidade com especificação | **Sim, apenas quando API retorna confirmação de gravação** | Crítica |
| Source AO RFQ completo | `source-ao/rfq.html`, `source-ao/rfq.js`, `source-ao/backend/src/sourcing.js` | POST com validação, armazenamento privado, idempotência e tracking | **Sim, após confirmação explícita da API** | Alta |
| Source AO candidatura de parceiro | `source-ao/partner-application.html`, `partner-application.js`, Worker | POST com dados encriptados, deduplicação e revisão comercial | **Sim, apenas quando API confirma gravação** | Alta |
| Source AO radar | `sourceao.js`, `opportunity-radar.js`, Worker | Radar de procuras local no navegador e radar de oportunidades de base consultável | **Não garante monitorização autónoma de pedidos privados** | Alta |
| Consultas e confirmação de fornecedor | `source-ao/confirm.html` e Worker | Fluxo protegido de verificação, não apresentado como stock em tempo real sem evidência | Não é formulário de lead de cliente | Crítica para sourcing |

## Correções incluídas nesta intervenção
1. Pedido rápido do Source AO com campos separados de material, quantidade numérica, unidade, especificação, localização, prioridade, contacto, consentimento obrigatório e validação.
2. Resultado com distinção entre **pedido registado com referência** e **notificação à equipa**, e canal WhatsApp manual complementar sem afirmar envio automático.
3. Pesquisa Source AO com estado explícito do backend, fonte interna indexada e ligações para pesquisa externa em Angola, Namíbia e África do Sul. São pesquisas públicas opcionais, não fornecedor confirmado.
4. Cadastro de materiais enriquecido para pesquisas de capacetes de segurança/HELMET e PVC em diferentes formatos; não converter **PVC 15 kg** automaticamente em tubo PVC nem atribuir stock.
5. Fonte de oportunidades: a API e o motor de descoberta conhecem fornecedores previamente indexados e suportam enriquecimento privado, mas não oferecem pesquisa exaustiva do mercado em tempo real.
6. Fila D1 `intake_alerts` criada por triggers de base de dados após registo de sourcing ou candidatura de parceria; **alerta persistente sem depender do navegador**.
7. Envio interno via Resend apenas quando configurado com segredos Worker `RESEND_API_KEY`, `SOURCE_AO_ALERT_FROM`, `SOURCE_AO_ALERT_TO`, e `PII_ENCRYPTION_KEY`. Tarefa cron reenvia alertas pendentes e aplica chave de idempotência; sem credenciais mantém pendentes. Endpoint privado protegido `GET /api/admin/intake-alerts/status` fornece contadores sem dados pessoais.
8. Política de privacidade Source AO atualizada para uso condicionado do canal de notificação interno.
9. Área Supply: botão para **RFQ persistente do Source AO** como caminho principal, WhatsApp como alternativa.
10. Homepage PT/EN: link de candidatura de parceria integrado no bloco existente de parceiros, sem design adicional.
11. Assistente HMATIAS: atualizadas respostas sobre captação, Source AO, pesquisa indexada e impossibilidade de confirmar notificações. Worker Cloudflare alternativo corrigido para eliminar preços antigos de Business Services e Taurus.
12. Documentação/controle de qualidade: testes automatizados para envio real simulado, limites, falhas e persistência da fila.

## Entregas que não estão ativas automaticamente
- Os formulários de contacto do site institucional ainda exigem ativação de `lead-intake/` com D1, Turnstile, HubSpot e e-mail. O módulo foi preparado anteriormente e está intencionalmente desativado para não prometer receção sem registo.
- A migração `source-ao/backend/migrations/0023_intake_alert_queue.sql` e o Worker atualizado só ficam operacionais **após deployment de produção do Source AO** e validação das variáveis de ambiente.
- O repositório guarda apenas código e documentação, **não** chaves de Cloudflare, HubSpot, Resend ou fornecedores.
- A ligação HubSpot disponível em ChatGPT pode necessitar de reautorização de escrita; essa autorização não cria um canal backend de website automaticamente.
- Não se comprovou o acesso do Worker em produção nem a entrega de alertas a `geral@comercialhmatiasps.com` nesta revisão. Os testes de CI com respostas simuladas **não equivalem à confirmação do e-mail real**.

## Checklist de aceitação antes de declarar o Source AO operacional
1. Em staging: aplicar migração 0023, executar casos PVC (15 kg, CAMAMA, urgente, FF) e HELMET (quantidade desconhecida). Confirmar campos distintos no D1.
2. Abrir `/api/admin/intake-alerts/status` com token privado; confirmar que a fila `pending` aumenta para cada pedido e candidatura.
3. Configurar e verificar remetente no serviço Resend e destinatário interno; criar pedidos de teste autorizados. Confirmar que `pending` passa a `sent` e que o e-mail chega à caixa de entrada correta.
4. Simular falha no serviço de e-mail: o pedido deve permanecer no D1, o alerta em `pending` e o cron deve voltar a tentar.
5. Fazer pesquisa interna Source AO para HELMET e PVC, comparar lista de referências vs fornecedores realmente verificados, não anunciar stock sem cotação.
6. Testar Smart RFQ, Business, Clean, Supply, Home, Agendamento e parceiros em mobile e desktop; verificar que um clique em WhatsApp **não** foi contabilizado como mensagem recebida.
7. Testar a base de conhecimento do assistente com perguntas: «Como enviar RFQ e acompanhar?», «Já receberam?», «Qual o stock de capacete?», «Como procuro PVC 15 kg em Camama?», «Como propor parceria?», «Taurus e preço?». Não pode divulgar preços antigos nem garantir entrega de notificações.
8. Testar proteção de dados, consentimento, limites de acesso e documentação aplicável ao uso do fornecedor de e-mail.
9. Apenas depois, promover o Worker do Source AO pelo processo controlado de produção previsto no repositório e monitorizar notificações.

## Regra de apresentação comercial
CATOCA é uma organização que solicitou um RFQ à HMATIAS segundo o utilizador; esta circunstância **não autoriza** listar a organização como cliente contratado, parceiro ou obra executada no website.

## Indicador operacional a acompanhar
**Pedidos registados → pedidos notificados → pedidos atribuídos → fornecedores contactados → propostas emitidas → negócios ganhos.**
O número de páginas, pesquisas e cliques por si só não corresponde a receita nem a capacidade de execução.
