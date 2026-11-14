# HMATIAS AI Assistant — Cloudflare Worker

## Current architecture

- The public website is published through GitHub Pages by `.github/workflows/jekyll-docker.yml` (workflow display name: **HMATIAS Pages Deploy**).
- The browser assistant is loaded by the public pages. `assistant-api-bridge.js` routes the legacy API URL to `https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai`.
- The assistant Worker source is `cloudflare-ai/src/index.js`.
- Its authoritative Wrangler configuration is `cloudflare-ai/wrangler.jsonc`, with Worker name `hmatias-ai-assistant` and entry point `src/index.js`.
- The deployment and post-deploy smoke tests for that Worker are owned by `.github/workflows/hmatias-ai-worker-deploy.yml`. Changes under `cloudflare-ai/**` or to `assistant-api-bridge.js` trigger the validation workflow; pushes to `main` deploy the dedicated assistant Worker and test both its health endpoint and a real AI response.

## Separate root Wrangler configuration

The repository-root `wrangler.jsonc` is named `hmatias-website1` and points at the same source file using a different Worker identity. It belongs to a separate Cloudflare Workers Builds integration and is **not** the authoritative deployment configuration for the website assistant.

Do not deploy the assistant with the root config. Use the config inside this folder. If the separate `hmatias-website1` Cloudflare Git integration is no longer intended, disconnect that integration in the Cloudflare dashboard before removing its root configuration from the repository. Do not delete a Worker or route until confirming that it has no production traffic.

## Cloudflare setup for the assistant

1. Use `cloudflare-ai` as the Root directory if configuring this Worker in Cloudflare Workers Builds.
2. Keep the AI binding named `AI` as declared in `wrangler.jsonc`.
3. The assistant endpoint is `https://hmatias-ai-assistant.matias500-mhf.workers.dev/api/ai`.
4. Keep a suitable rate limit for the public API before expanding traffic.
5. Never expose Cloudflare API tokens or other secrets in this repository.

## Security and answer-quality controls

The Worker:
- allows the HMATIAS website origins;
- accepts POST JSON only for chat requests;
- rejects empty and oversized messages and limits history length;
- uses `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and a restrictive referrer policy;
- instructs the assistant not to invent prices, stock, contracts, certifications, partnerships or guarantees;
- does not ask visitors for passwords, banking information or unnecessary sensitive data.

The website bridge and Worker are separately validated by the GitHub Actions workflow. A successful GitHub Actions run confirms the dedicated assistant deployment; it does not prove that the separate `hmatias-website1` native Cloudflare Builds project is healthy.


## SOURCE AO — recuperação pública e limites de ligação

O assistente pode enriquecer perguntas de fornecimento com uma consulta **read-only** ao endpoint público `GET /api/search` do Worker `source-ao-api-staging`.

- O Worker de IA **não recebe binding D1** e não consulta a base diretamente.
- A ligação é opcional e só é usada quando a variável `SOURCE_AO_PUBLIC_API_BASE` aponta para um hostname HTTPS `.workers.dev` com a etiqueta `staging` (por exemplo, o hostname do Worker `source-ao-api-staging`). O código rejeita hosts de produção, domínios personalizados e URLs com path/query/hash.
- Configure essa variável apenas no Worker de IA de staging, depois de o endpoint público e a D1 `source-ao-staging` estarem preparados e validados. Não configure a variável no Worker público `hmatias-ai-assistant` nesta fase.
- A consulta só usa `GET /api/search`; não chama rotas administrativas, descoberta externa, inteligência privada ou operações de escrita.
- O assistente envia ao modelo apenas uma allowlist de campos públicos: tipo, identificador público, nome, categoria, especificação, unidade, estado e datas de verificação. Campos inesperados — incluindo fornecedor, contacto, preço, custo e quantidade — são descartados.
- O código limita a pesquisa a uma chamada por pergunta elegível, até 8 termos, 12 resultados e timeout de 2,5 segundos. A falha ou ausência da API não interrompe o chat.
- Estados como `discovered`, `source_checked`, `supplier_confirmed` e `in_stock_confirmed` são distintos. Mesmo uma observação de stock confirmada não é uma cotação nem uma garantia futura.

### Ativação controlada em staging

1. Confirmar que `source-ao-api-staging` está publicado com a D1 de staging, migrações aplicadas e rota `GET /api/search` funcional.
2. Criar/configurar um Worker de IA de staging separado do Worker público e apontar `SOURCE_AO_PUBLIC_API_BASE` para o hostname HTTPS `.workers.dev` desse backend de staging.
3. Testar pesquisa, ausência de resultados, indisponibilidade da API e rejeição de hosts de produção.
4. Só ponderar uma ligação ao Worker público depois de aceitação funcional, revisão de privacidade e autorização explícita. Não há ativação em produção nesta PR.

Os testes locais executam-se com `npm test` dentro de `cloudflare-ai` ou com `node --test cloudflare-ai/test/*.test.mjs` na raiz do repositório.
