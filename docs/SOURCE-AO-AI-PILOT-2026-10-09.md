# Source AO — piloto de descoberta externa assistida por IA

Data: 9 outubro 2026. Estado: **ramificação de desenvolvimento; não ativado em produção**.

## Objetivo
Pesquisa assistida de fornecedores em fontes abertas para Angola, Namíbia e África do Sul. O piloto preserva o fluxo de RFQ existente e não importa respostas para a base privada de fornecedores sem revisão humana.

## Arquitetura
- Página interna não indexável: `/source-ao/supplier-discovery.html`. Token administrativo apenas em memória da sessão; nunca em localStorage, URL, Analytics ou logs.
- Endpoint autenticado: `POST /api/admin/supplier-discovery` protegido com o mesmo `ADMIN_API_TOKEN` do Worker (em staging admite o token piloto correspondente).
- Brave Search API: até uma pesquisa por mercado solicitado, até 3 mercados, até 12 referências públicas distintas. A região indicada é **mercado pesquisado**, não prova de país de origem do fornecedor.
- OpenAI GPT-5.4 Mini: opcional; classifica pertinência de títulos/excertos da pesquisa via Structured Outputs. Não cria fornecedores novos nem determina stock, preço, certificados, localização ou prazo.
- Controlo de custo: autorização obrigatória, rate limit 6 pesquisas/hora por IP, migração D1 `0024_external_discovery_usage.sql` para orçamento atómico global de **5 pedidos/dia** (configurável, máximo 10). Um pedido efetua até três buscas Brave e uma análise GPT.
- Chaves enviadas somente do Cloudflare Worker aos serviços externos. A página estática nunca contém chaves da Brave/OpenAI.

## Configuração segura (não criar ou enviar chaves no chat)
1. Criar/ativar as credenciais no painel dos fornecedores e manter limites de faturação na respetiva conta.
2. Guardar via Cloudflare Worker **Secrets**: `BRAVE_SEARCH_API_KEY` e, se desejar análise generativa, `OPENAI_API_KEY`.
3. Aplicar migração D1 `0024_external_discovery_usage.sql` ao ambiente de staging.
4. Configurar `SOURCE_AO_AI_PILOT_ENABLED=true` **apenas em staging**, depois de validar credenciais e limites.
5. Opcional: `SOURCE_AO_DISCOVERY_DAILY_LIMIT=5` (intervalo 1–10; números maiores são limitados a 10).
6. Verificar CORS entre o domínio autorizado e o Worker, e executar o conjunto completo de testes de segurança e regressão.
7. Simular entradas: **cinta PP 9 mm**, **capacete de segurança**, **PVC 15 kg em Camama** e **ASTM A193 B7/Xylan**. Os testes de regressão não devem afirmar que PVC é obrigatoriamente tubo.
8. Só considerar publicação após confirmação de pesquisa real, faturação, proteção de credenciais, inspeção mobile e validação técnica humana.

## Exemplo de pedido
```http
POST /api/admin/supplier-discovery
Authorization: Bearer <ADMIN_API_TOKEN>
Content-Type: application/json

{"query":"cinta PP 9 mm, 1 rolo","markets":["AO","NA","ZA"]}
```

## Contrato de evidência
Cada resultado mostra `source_title`, `source_url`, `source_snippet`, `market_searched` e `evidence_status=web_candidate_only`; os indicadores `product_confirmed`, `stock_confirmed`, `price_confirmed` e `lead_time_confirmed` ficam `false`. `ai_assessment` é apenas um parecer sobre relevância e não substitui contacto direto, MTC, catálogo técnico e RFQ.

O endpoint não envia automaticamente mensagens, não grava candidaturas como fornecedores homologados e não altera dados comerciais atuais.

## Checklist antes de ativar
- [ ] Testes Node verdes na ramificação, incluindo negativa de acesso e limite diário.
- [ ] Teste end-to-end no staging com Brave real.
- [ ] Verificação do formato de resposta da OpenAI com chave própria; falha da IA deve preservar ligações originais e não inventar resultados.
- [ ] Revisão de adequação técnica por procurement e confirmação de país, contactos e disponibilidade.
- [ ] Confirmar que nenhum token aparece em ficheiros públicos, URLs, Analytics ou logs.
- [ ] Ativar somente com decisão explícita de configuração de faturação e responsáveis comerciais.

**Regra comercial:** a expressão «IA» só deve ser utilizada como capacidade de análise assistida. A investigação de fornecedores e as respostas comerciais continuam sujeitas a verificação pela HMATIAS.
