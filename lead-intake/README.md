# HMATIAS — Receção de leads (Fase 1)

Estado: **código preparado e DESATIVADO no website**. Não alterar este estado até completar os testes de armazenamento, HubSpot, confirmação e privacidade. GitHub Pages não executa servidores nem grava automaticamente os dados de formulários.

## Fluxo preparado

1. O visitante preenche **Contacto**, **Business Services** ou **Agendamento**.
2. Com a integração explicitamente ativada, o formulário exige e-mail, aceitação da política de privacidade e verificação Cloudflare Turnstile.
3. O Worker valida origem, limites e campos e grava um pedido na base Cloudflare D1. Só depois devolve uma referência `HM-AAAAMMDD-XXXXXXXX`.
4. O Worker tenta registar um contacto/submissão num **formulário HubSpot previamente configurado**, notificar a HMATIAS e enviar comprovativo por e-mail através da Resend.
5. Se as integrações externas falharem, o pedido permanece na D1 para reprocessamento (cron de 15 em 15 minutos). A interface não confunde registo do pedido com entrega de e-mail nem adjudicação.
6. Caso não seja possível confirmar a gravação, o website oferece um link de WhatsApp preparado; **não** indica que a HMATIAS recebeu o pedido.

No estado atual, a integração **não é carregada**, não recolhe dados nem altera os fluxos WhatsApp existentes. O novo CSS `mobile-contact-layout.css` é uma melhoria independente, segura para publicação.

## Pré-requisitos do proprietário da infraestrutura

1. Na conta Cloudflare da HMATIAS: criar D1 `hmatias-leads` e um Turnstile para `comercialhmatiasps.com` (e `www` quando aplicável).
2. Em HubSpot: criar um formulário de captação para pedidos HMATIAS com campos **email, firstname, lastname, phone, company**. Se desejar gravar descrição/referência em HubSpot, criar campo de texto longo e definir a sua propriedade interna em `HUBSPOT_MESSAGE_FIELD`. Verificar aviso de consentimento e ajustar permissões. Precisamos do **ID da conta HubSpot e GUID do formulário**, não de qualquer palavra-passe.
3. Configurar conta Resend e confirmar um domínio de envio permitido para um remetente HMATIAS. Definir destinatário interno `geral@comercialhmatiasps.com`.
4. Na consola Cloudflare, entrar na pasta `lead-intake`, criar/associar D1, substituir o `database_id` de exemplo em `wrangler.jsonc` com o ID verdadeiro e executar a migração via Wrangler. **Nunca colocar IDs privados, tokens ou chaves de API em JavaScript público.**
5. Guardar por **secrets** do Worker: `TURNSTILE_SECRET`, `RATE_LIMIT_SALT` (segredo gerado aleatoriamente) e `RESEND_API_KEY`. Configurar por vars/segredos conforme política interna: `HUBSPOT_PORTAL_ID`, `HUBSPOT_FORM_GUID`, `RESEND_FROM`, `LEADS_NOTIFY_TO`, opcional `HUBSPOT_MESSAGE_FIELD`.
6. Implementar um hostname ou rota HTTPS isolada de Cloudflare Worker: `https://<worker-host>/v1/leads`. Não partilhar o token Resend/Cloudflare/HubSpot em conversas, tickets ou ficheiros do GitHub.
7. Rever `privacidade.html` e `privacy.html` **antes da ativação**: quando a funcionalidade estiver ativa, informar explicitamente o visitante de que os dados são registados em Cloudflare D1 e processados por HubSpot/Resend para resposta, com prazo de conservação, direitos e contactos. Confirmar o enquadramento aplicável com o responsável de proteção de dados.
8. Depois de validado em staging, colocar em cada uma das **seis páginas** `index.html`, `en.html`, `servicos-administrativos.html`, `business-services.html`, `agendamento.html`, `booking.html` os atributos no elemento `html`:
   - `data-hmatias-leads-endpoint="https://<worker-host>/v1/leads"`
   - `data-hmatias-turnstile-site-key="<PUBLIC_SITE_KEY>"`

O `site-bootstrap.js` só carregará `lead-intake-client.js` quando ambos os atributos estiverem corretamente configurados. Até lá os formulários **continuam apenas a preparar WhatsApp**, sem promessas de registo.

## Comandos exemplificativos (no ambiente do responsável Cloudflare)

```sh
cd lead-intake
npx wrangler d1 create hmatias-leads
# Atualizar database_id em wrangler.jsonc com o resultado acima.
npx wrangler d1 migrations apply hmatias-leads --remote
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RATE_LIMIT_SALT
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Configurar as outras vars na Cloudflare e verificar que `GET /health` responde `{"status":"ready"}`. Na ausência de qualquer requisito crítico, responde `not_configured` e o envio POST falha fechado (`503`).

## Testes obrigatórios antes de publicar

- Em staging: pedido válido com email e consentimento cria um registo na D1 e referência única; submissão repetida com o mesmo nonce retorna a mesma referência.
- HubSpot: confirmar visualmente a submissão/contacto no formulário aprovado; não confundir com um negócio fechado nem criar oportunidades fictícias.
- Confirmar e-mail interno e recibo do cliente com a referência; simular falha externa, verificar pedido preservado na D1 e recuperação pelo cron.
- Origem externa, desafio Turnstile inválido, consentimento ausente e payload demasiado longo devem ser recusados. Verificar proteção anti-bot e limite de 12 submissões/hora/chave anónima.
- Testar PT/EN, Android e iPhone, Wi-Fi e 4G. Confirmar botão WhatsApp de contingência sem mensagens automáticas enganadoras.
- Validar política de privacidade e segurança de acesso à D1; não expor tabelas ou PII nos logs nem no frontend.
- Retenção: limpeza automática após 180 dias por cron, sujeita a políticas e obrigações aplicáveis.

## Âmbito excluído deste lançamento

- Smart RFQ institucional (atualmente gera briefing local; integrar numa fase seguinte, preservando revisão e consentimento explícito).
- SOURCE AO: conserva sistema próprio de RFQ e D1; não misturar tabelas/segredos deste Worker com os do Source AO.
- Nenhum pagamento automático, preço, confirmação de agendamento ou disponibilidade em tempo real.

## Limitação atual da ligação HubSpot ao ChatGPT

O conector permite leitura de contactos, mas a escrita requer reautorização no HubSpot. A autorização do conector ChatGPT **não instala automaticamente** uma integração do website. O mecanismo do Worker usa o **formulário HubSpot de captação**, que tem de ser criado/configurado e testado pelo responsável pela conta.
