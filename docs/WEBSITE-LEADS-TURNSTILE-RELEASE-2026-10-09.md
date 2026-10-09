# Source AO / HMATIAS — receção segura de pedidos institucionais

Data: 09/10/2026. **Estado: preparação de segurança; ativação em produção não autorizada por este documento.**

## Objetivo
Receber pedidos da homepage, Business Services e agendamento em português e inglês na D1 do Source AO, com referência de registo. Manter a alternativa WhatsApp / e-mail manual se a API ou verificação de segurança falhar. O fluxo Source AO RFQ permanece independente.

## Controlos de segurança
1. O servidor só aceita submissões de origem autorizada, sujeitas aos limites por IP definidos em `src/security.js`.
2. `WEBSITE_LEAD_INTAKE_ENABLED` deve estar `true` **e** existir D1, `PII_ENCRYPTION_KEY`, site key pública e secret privada Cloudflare Turnstile. Se faltar um requisito, a API responde que a captação está desativada.
3. `GET /api/website-leads/config` expõe ao frontend apenas a **site key pública**, nunca a secret. O widget só é instalado quando essa configuração está completa.
4. Cada novo pedido exige `turnstileToken`; o backend valida via siteverify Cloudflare e exige sucesso e hostname `comercialhmatiasps.com` ou `www.comercialhmatiasps.com`. Sem validação, responde HTTP 403 e **não grava dados**.
5. Os contactos e descrições são gravados cifrados em D1 e só podem ser lidos através do painel administrativo no host Worker, mediante bearer token. Reenvios idênticos preservam referência; reenvios alterados com o mesmo nonce são recusados.
6. A confirmação de registo **não significa que um alerta foi entregue**. Sem chave de envio Resend, é obrigatório consultar o painel privado e atribuir seguimento manual.

## Variáveis e secrets necessários
**Cloudflare Worker, secret privada:**
- `WEBSITE_LEADS_TURNSTILE_SECRET` — secret do widget Turnstile, configurada na Cloudflare, nunca em GitHub como texto nem no navegador.
- `PII_ENCRYPTION_KEY` — valor privado existente e preservado, necessário para desencriptação dos registos atuais.
- `ADMIN_API_TOKEN` — credencial da área privada, conservada no servidor.
- `RESEND_API_KEY` — apenas depois de confirmar remetente e orçamento da conta, para alertas.

**Configuração de ambiente do Worker:**
- `WEBSITE_LEADS_TURNSTILE_SITE_KEY` — identificador **público** do widget para o domínio.
- `WEBSITE_LEAD_INTAKE_ENABLED` — `false` até concluir os testes; ativar `true` só após aprovação de staging/produção.
- `SOURCE_AO_ALERT_FROM`, `SOURCE_AO_ALERT_TO` — remetente e destino internos verificados.

## Sequência de aceitação antes de ativar
- [ ] Validar a migração D1 0026 e a retenção aplicável, bem como o aviso de privacidade.
- [ ] Criar widget Turnstile para os domínios reais; guardar segredo apenas no Worker.
- [ ] Usar staging e submeter pedido válido com consentimento e desafio; confirmar ciphertext, referência, acesso à ficha privada.
- [ ] Tentar sem challenge, com challenge inválido, domínio diferente e excesso de frequência; todos devem ser bloqueados sem gravação.
- [ ] Verificar que, se o widget não carregar, WhatsApp e e-mail manual continuam disponíveis.
- [ ] Testar PT/EN e mobile, incluindo casos de campos obrigatórios e submissão repetida.
- [ ] Testar envio Resend com alerta real, aceitar por fornecedor, confirmar na caixa oficial e fazer follow-up; **não confundir provider accepted com inbox delivered**.
- [ ] Aprovar ativação gradual no Worker; inspecionar logs sem revelar dados pessoais.

## Importante
O código do piloto de pesquisa Brave/GPT e os preços dos fornecedores não fazem parte da ativação dos leads. Não publicar credenciais API/CRM em `runtime-config.js`, ficheiros HTML ou tickets. Não confundir os relatórios de indexação do Google com o sitemap e os testes de publicação.
