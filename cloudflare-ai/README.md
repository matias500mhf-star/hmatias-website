# HMATIAS Cloudflare Worker

Backend do website HMATIAS. O entrypoint ativo é `cloudflare-ai/src/index.js`.

## Estado

- `/api/ai`: assistente virtual existente.
- `/api/contact`: implementação controlada de captação de leads da HMATIAS Business Services.
- A nova rota de contacto **não deve ser ligada ao formulário público** até D1, Turnstile e e-mail transacional estarem configurados e testados.

## Segurança da rota `/api/contact`

A rota aceita apenas `POST` JSON proveniente dos domínios HMATIAS autorizados. Implementa:

- limite de payload de 32 KB;
- validação server-side dos campos;
- allowlist de serviços;
- consentimento de privacidade obrigatório;
- honeypot anti-bot;
- validação server-side do Cloudflare Turnstile;
- rate limit de 5 submissões por janela de 15 minutos, com identificador de rede pseudonimizado por hash com salt;
- D1 como armazenamento persistente;
- código de referência `HBS-AAAAMMDD-XXXXXXXX`;
- notificação interna por e-mail e confirmação ao cliente quando houver e-mail;
- `Cache-Control: no-store` e headers de segurança básicos.

A submissão só recebe `201 Created` depois de o lead ser gravado no D1. Uma falha posterior de e-mail não apaga nem invalida o lead já persistido; o estado da notificação fica registado na base de dados.

## Campos aceites

`client_name`, `contact`, `email` opcional, `location` opcional, `service_type`, `details`, `privacy_consent`, `turnstile_token`, `website` honeypot e `language` opcional (`pt` ou `en`).

Valores permitidos em `service_type`:

- `administrative_correspondence`
- `professional_cv`
- `document_management`
- `business_proposal`
- `business_presentation`
- `sme_admin_support`
- `visa_admin_support`
- `other`

## D1

O schema inicial está em `migrations/0001_leads.sql`.

Criar a base:

```bash
cd cloudflare-ai
npx wrangler d1 create hmatias-leads
```

Copiar o `database_id` real devolvido pela Cloudflare para a configuração ativa. O ficheiro `wrangler.contact.example.jsonc` é apenas um modelo seguro e contém um placeholder intencional.

Aplicar a migration no D1 remoto:

```bash
npx wrangler d1 migrations apply hmatias-leads --remote
```

O binding deve chamar-se exatamente `LEADS_DB`.

## Turnstile

Criar um widget Turnstile autorizado para `comercialhmatiasps.com` e `www.comercialhmatiasps.com`.

A site key é pública e pode ser utilizada no frontend. A secret key é privada e deve ser configurada apenas no Worker:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
```

A validação final do token é sempre feita pelo backend através do Siteverify. Tokens Turnstile são temporários e de utilização única.

## E-mail transacional

A implementação controlada usa Resend.

Antes da ativação:

1. validar no Resend o domínio que será usado como remetente;
2. criar uma API key restrita ao envio;
3. definir um remetente válido, por exemplo `HMATIAS Business Services <noreply@DOMINIO_VALIDADO>`;
4. testar a entrega para `comercial@hmatiasps.ao` antes de ligar o formulário público.

Secrets obrigatórios:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
npx wrangler secret put RATE_LIMIT_SALT
```

Opcionalmente, `LEAD_NOTIFICATION_TO` pode ser configurado como variável normal. Se for omitido, o código usa `comercial@hmatiasps.ao`.

O `RATE_LIMIT_SALT` deve ser uma cadeia aleatória longa e exclusiva deste ambiente. Não reutilizar palavra-passe, NIF, telefone, chave de API ou outro dado previsível.

## Deploy controlado

Depois de D1, Turnstile e Resend estarem prontos:

```bash
cd cloudflare-ai
npx wrangler deploy
```

Confirmar que a rota pública encaminha `/api/contact` para este Worker. O `/api/ai` permanece separado logicamente no mesmo Worker.

## Teste end-to-end obrigatório

O script `scripts/smoke-contact.mjs` cria um lead de teste explícito. Usar apenas após configurar o ambiente real e obter um token Turnstile fresco:

```bash
HMATIAS_API_BASE="https://api.comercialhmatiasps.com" \
HMATIAS_TURNSTILE_TOKEN="TOKEN_FRESCO" \
node scripts/smoke-contact.mjs
```

Critérios de aprovação:

1. resposta HTTP `201`;
2. `success: true`;
3. referência `HBS-...` devolvida;
4. registo real criado no D1;
5. notificação interna recebida em `comercial@hmatiasps.ao`;
6. estados de notificação registados no D1;
7. teste negativo de Turnstile inválido devolve `403`;
8. teste de payload inválido devolve `400`;
9. excesso de pedidos devolve `429`.

## Regra de ativação

Não alterar o formulário público para enviar para `/api/contact` enquanto estes quatro pontos não estiverem confirmados:

1. D1 criado e migration aplicada;
2. Turnstile configurado e validado;
3. e-mail transacional autenticado e testado;
4. teste end-to-end concluído com gravação real, código de referência e notificação recebida.

O `/api/ai` permanece separado da captação de leads.

## Limite operacional atual

O repositório está preparado, mas a criação dos recursos D1, do widget Turnstile, dos secrets e da validação do domínio de e-mail exige acesso autenticado às contas Cloudflare e Resend. Esses valores nunca devem ser colocados no GitHub nem enviados em texto público.
