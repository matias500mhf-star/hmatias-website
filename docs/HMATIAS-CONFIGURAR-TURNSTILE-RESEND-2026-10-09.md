# HMATIAS — desbloquear Turnstile e envio de alertas

Diagnóstico de 09/10/2026: a API Cloudflare respondeu **HTTP 403** ao consultar os widgets Turnstile com o token geral usado na publicação dos Workers. O domain Resend `comercialhmatiasps.com` está verificado e habilitado para envio. Há uma chave Resend existente chamada `Onboarding`, mas o respetivo valor não pode ser recuperado; não deve ser copiado para chats, commits ou workflows.

## Autorizações a configurar sem partilhar os valores

### A. Turnstile — token próprio
1. Aceder a **Cloudflare > My Profile > API Tokens > Create Token**.
2. Dar apenas a permissão de conta **Turnstile Sites: Write** (ou `Account:Turnstile:Edit`, conforme o painel), para a conta Cloudflare correta. Não modificar o token existente de Workers.
3. No GitHub, abrir `Settings > Environments > source-ao-staging > Environment secrets`.
4. Adicionar o novo token como `CLOUDFLARE_TURNSTILE_API_TOKEN`. **Não enviar o valor ao ChatGPT.**
5. Em `Actions > HMATIAS Turnstile Protected Setup > Run workflow`, selecionar `main` e executar uma vez.
6. O workflow pesquisa um widget de nome exato, cria se necessário, restringe a `comercialhmatiasps.com` e `www.comercialhmatiasps.com`, instala a site key e secret como bindings privadas no Worker existente. Não ativa captação.

### B. Resend — chave de envio dedicada
1. Abrir `Resend > API Keys`. O domínio existente já está verificado para **sending**.
2. Criar uma nova chave **Sending access**, limitada ao domínio verificado, específica para os alertas HMATIAS.
3. Adicionar o valor somente em `Settings > Environments > source-ao-staging > Environment secrets`, com o nome `SOURCE_AO_RESEND_API_KEY`.
4. Não inserir a chave no GitHub em arquivos, issues, comentários, nem na conversa.
5. A publicação do Source AO lê este secret e configura `RESEND_API_KEY` no Worker no deploy de produção autorizado. Revalidar com o workflow `Source AO Resend Configuration Readiness`.

### C. Aceitação final
- Rever texto dos formulários e a política de privacidade em PT/EN.
- Confirmar que o workflow do Turnstile passa e que o backend mantém `WEBSITE_LEAD_INTAKE_ENABLED=false`.
- Confirmar que a chave Resend é detectada pelo workflow e que a conta do Worker aceita email de teste com remetente/domínio verificado.
- Validar no staging uma submissão real com consentimento, challenge Turnstile e referência na D1, sem criar um lead fictício para análise comercial.
- Confirmar que o alerta foi entregue na caixa `geral@comercialhmatiasps.com` antes de ativar o recebimento automático institucional.
- Ativar `WEBSITE_LEAD_INTAKE_ENABLED=true` só quando estas condições estiverem confirmadas; preservar o envio WhatsApp/e-mail manual durante a transição.

**Limites:** O serviço de pesquisa Brave/OpenAI também permanece desligado por falta de chaves e limites aprovados. O workflow Turnstile é idempotente e manual; não criar novos widgets em cada deploy. O token de Workers deve continuar com a sua permissão original e separado do token Turnstile.
