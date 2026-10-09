# HMATIAS — Origem, qualificação e acompanhamento de leads B2B

Documento operacional para captação com precisão, 10/10/2026. **Não constitui autorização para publicar anúncios, ativar intake ou enviar dados pessoais a terceiros.**

## 1. As seis etapas e as respetivas fontes de prova

| Etapa | Evento/identificador | Conta como lead recebido? |
|---|---|---|
| Visita ou origem de campanha | GA4 / tag UTM, somente após consentimento estatístico | Não |
| Clique WhatsApp/telefone/e-mail | `contact_click` e `lead_handoff` | Não; falta confirmação do recebimento |
| Pedido de website persistido | `saved=true`, referência `HM-AAAAMMDD-XXXXXXXX` e entrada cifrada na D1 | **Sim**, uma vez por referência |
| Contacto externo recebido | Mensagem/telefonema recebido, conferido manualmente e registado no CRM | **Sim**, depois de confirmação |
| RFQ comercial qualificado | Equipa valida tipo, especificações, quantidade/escopo, destino e prazo | É oportunidade, não venda |
| Proposta / adjudicação | Documento comercial emitido / aceitação documental | São fases distintas |

A atribuição acrescentada ao registo encriptado do website inclui somente `source`, `medium`, `campaign`, `landing_path` e `referrer_host`, quando disponíveis. Não registar termos de pesquisa, conteúdo das mensagens, identificadores de cliques, URL de referência completa ou dados pessoais no GA4.

**Limite medido:** o código lê UTMs presentes **na página onde o cliente efetivamente submete o formulário**. Se o cliente navegar para outra página e os parâmetros se perderem, a origem pode ficar vazia. Não usar uma origem adivinhada como dado confirmado. Sem armazenamento oculto entre páginas.

## 2. Páginas de destino para campanhas

Para garantir rastreabilidade sem criar novas páginas:
- Construção via formulário principal: `https://comercialhmatiasps.com/?utm_source=linkedin&utm_medium=organic&utm_campaign=construcao_luanda_2026#contacto`
- Facilities via formulário principal: `https://comercialhmatiasps.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign=facilities_luanda_2026#contacto`
- Business Services: `https://comercialhmatiasps.com/servicos-administrativos.html?utm_source=linkedin&utm_medium=organic&utm_campaign=business_services_2026`

Os códigos de campanha só admitem letras sem acentos, algarismos, hífen, sublinhado e ponto. O formulário só guarda informação após aceite da sua declaração de privacidade e validação do desafio Turnstile. A URL de destino pode ser revista antes da campanha; as acima são modelos, não campanhas lançadas. Source AO possui RFQ próprio e monitorização distinta.

## 3. Qualificação manual de uma oportunidade

**Recebido** significa contacto real e identificado. **Qualificado** exige confirmação pela equipa comercial. Para priorizar, usar rubrica interna de até 100 pontos (não é avaliação automática do website):

- Contacto responsável válido e canal de retorno: 15 pontos.
- Empresa ou entidade compradora identificada: 15 pontos.
- Necessidade técnica ou escopo concreto: 25 pontos.
- Local de execução ou entrega: 10 pontos.
- Prazo de aquisição / intervenção: 15 pontos.
- Sinais de intenção de contratação e disponibilidade para orçamento: 20 pontos.

Pontuação indicativa **70–100** = contacto prioritário, sujeito a revisão humana. `<70` = esclarecer campos em falta antes de preparar proposta. Não exigir NIF, documentos de identidade, dados bancários ou orçamento confidencial num formulário público. O prazo de resposta sugerido é **até quatro horas úteis** para confirmar receção, condicionado à disponibilidade operacional real; não publicar compromisso de SLA sem validação interna.

## 4. Responsável e CRM

Atribuir responsável comercial, hora de receção, data/hora da primeira resposta, serviço, origem, referência D1/Source AO, próxima ação e etapa. Não criar duplicados por cada clique: conciliar pessoa/empresa **manualmente**, sem juntar RFQs diferentes apenas por telefone/email repetido.

Etapas recomendadas de operação: `Recebido → Em triagem → Contactado → Necessidade confirmada → RFQ/Proposta → Negociação → Adjudicado / Perdido`. No backend institucional atual existem apenas `received`, `triage`, `responded`, `closed`; não afirmar que as etapas comerciais mais detalhadas já estão ligadas automaticamente ao HubSpot.

**HubSpot:** em 10/10/2026 o conector lê `CONTACT`, `COMPANY` e `DEAL`, mas a escrita requer reautorização. Até ter permissão e testes, a D1 e o acompanhamento operacional são as fontes primárias dos pedidos digitais. Não criar contactos CRM por API sem confirmação de permissões, consentimento e deduplicação.

## 5. Relatório semanal de funil comercial

Acompanhar por origem e área: visitas com consentimento, cliques em contacto, pedidos `saved=true`, pedidos externos recebidos, leads qualificados, tempo mediano de primeira resposta, RFQs, propostas emitidas, adjudicações, valor adjudicado e custo por lead recebido **apenas se houver verba real de anúncios**. Não misturar cliques com solicitações recebidas e não contabilizar ausência de origem como `direct` automaticamente.

## 6. Bloqueios de ativação e evidência de teste

- O `website-lead-client.js` está sujeito ao `GET /api/website-leads/config`; se `enabled=false`, mantém WhatsApp e email manual sem gravar pedidos.
- Requer token Cloudflare com permissão Turnstile, widget válido e Worker `WEBSITE_LEADS_TURNSTILE_SECRET` e `WEBSITE_LEADS_TURNSTILE_SITE_KEY`.
- Requer chave Resend restrita ao domínio para os alertas, e verificação de receção real em `geral@comercialhmatiasps.com`. `accepted` pelo provedor não prova `delivered`.
- Efetuar ensaio controlado: um formulário real, consentimento, desafio válido, referência única, registo D1, alerta recebido e tarefa/responsável comercial. Sem inserir contactos sintéticos nas estatísticas de produção.
- Só depois considerar `WEBSITE_LEAD_INTAKE_ENABLED=true`, com rollback, monitorização e proteção contra duplicados.
- HubSpot necessita reautorização específica antes de integrar tarefas e contactos.
- **Nunca** expor secrets em repositórios, mensagens, relatórios públicos ou Analytics.

Estrutura e homepage aprovadas são preservadas. Qualquer edição futura exige revisão do histórico, `main` corrente e dos trabalhos paralelos para evitar sobreposição.
