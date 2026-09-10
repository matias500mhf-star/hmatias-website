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

Antes do deploy de `/api/contact`:

1. Criar uma base D1 para leads.
2. Aplicar `migrations/0001_leads.sql`.
3. Adicionar ao `wrangler.jsonc` o binding D1 com o nome `LEADS_DB` e o `database_id` real fornecido pela Cloudflare.

Não colocar IDs inventados ou credenciais no repositório.

## Secrets e variáveis obrigatórias

Configurar no ambiente Cloudflare, nunca no GitHub:

- `TURNSTILE_SECRET_KEY`
- `RATE_LIMIT_SALT`
- `RESEND_API_KEY`
- `RESEND_FROM`

Opcional:

- `LEAD_NOTIFICATION_TO` — se omitido, usa `comercial@hmatiasps.ao`.

O endereço definido em `RESEND_FROM` deve pertencer a um domínio validado no fornecedor de e-mail transacional.

## Turnstile

Criar o widget Turnstile para `comercialhmatiasps.com`, colocar apenas a site key pública no frontend e guardar a secret key exclusivamente no Worker. A validação final é sempre feita no backend através do Siteverify.

## Regra de ativação

Não alterar o formulário público para enviar para `/api/contact` enquanto estes quatro pontos não estiverem confirmados:

1. D1 criado e migration aplicada;
2. Turnstile configurado e validado;
3. e-mail transacional autenticado e testado;
4. teste end-to-end concluído com gravação real, código de referência e notificação recebida.

O `/api/ai` permanece separado da captação de leads.
