# HMATIAS — Inventário de migração de URLs
Data: 13 de novembro de 2026
Branch: feat/hmatias-platform-modernization-20261111
Estado: plano de migração em preparação; não aplicar redirects nem alterar o domínio de produção nesta fase.

## Objetivo
Preservar o histórico orgânico do domínio comercialhmatiasps.com durante a transição para a nova estrutura Astro. O sitemap legado contém 37 URLs. O repositório também contém páginas HTML adicionais que devem ser verificadas no Search Console e nos registos de tráfego antes de qualquer remoção.

## Regras obrigatórias
1. Nenhuma URL indexada, com impressões, cliques, backlinks ou tráfego de referência pode ser descartada sem destino equivalente ou decisão documentada.
2. Se o conteúdo e a intenção de pesquisa permanecerem os mesmos, preferir manter o URL atual.
3. Quando o URL mudar, criar um redirecionamento 301 direto para a página nova mais equivalente; evitar cadeias e redirecionamentos para a homepage.
4. Não redirecionar páginas sem correspondência real para páginas genéricas. Preservá-las no mesmo URL ou reconstruir a página equivalente.
5. Cada destino final deve ter canonical próprio, hreflang recíproco PT-AO/EN quando houver tradução equivalente, links internos atualizados e inclusão no sitemap final.
6. O sitemap novo só substitui o sitemap atual no momento da migração aprovada. A propriedade atual do Search Console e a configuração de Analytics devem ser mantidas.
7. Após a migração, monitorizar indexação, 404, soft-404, redirecionamentos, canonical escolhido pelo Google, cliques e impressões.

## URLs existentes no sitemap legado (37)

| URL atual | Destino/ação de migração proposto | Estado |
|---|---|---|
| / | / | Manter URL |
| /en.html | /en/ | 301 após validação da página EN |
| /construcao.html | /construcao/ | 301 após validação |
| /construction.html | /en/construction/ | 301 após validação |
| /facilities.html | /facilities/ | 301 após validação |
| /facilities-en.html | /en/facilities/ | 301 após validação |
| /supply.html | /supply/ | 301 após validação |
| /supply-en.html | /en/supply/ | 301 após validação |
| /rfq.html | /source-ao/smart-rfq/ | 301 apenas após confirmar equivalência funcional e formulários |
| /rfq-en.html | /en/source-ao/smart-rfq/ | 301 apenas após confirmar equivalência funcional e formulários |
| /catalogo-obras.html | /catalogo-obras/ | 301 após validar arquivo e conteúdo |
| /work-catalogue.html | /en/works-catalogue/ | 301 após validar arquivo e conteúdo |
| /credibilidade.html | /credibilidade/ | 301 após validar dados institucionais |
| /credibility.html | /en/credibility/ | 301 após validar dados institucionais |
| /clean.html | Página HMATIAS Clean recriada no preview em /clean/; manter o URL oficial até validar o catálogo, pedido multiartigo, Search Console e backlinks | Preservar até aprovação |
| /clean-en.html | Página HMATIAS Clean em inglês recriada no preview em /en/clean/; manter o URL oficial até validar equivalência, Search Console e backlinks | Preservar até aprovação |
| /karta.html | Página KARTA recriada no preview em /karta/; manter a URL oficial até validar o estado Alpha e aprovar a migração | Preservar até aprovação |
| /karta-en.html | Página KARTA EN recriada no preview em /en/karta/; manter a URL oficial até validar o estado Alpha e aprovar a migração | Preservar até aprovação |
| /servicos-administrativos.html | /business-services/ | 301 após validar formulário e conteúdo |
| /business-services.html | /en/business-services/ | 301 após validar formulário e conteúdo |
| /agendamento.html | Manter /agendamento.html até existir rota funcional equivalente | Preservar |
| /booking.html | Manter /booking.html até existir rota funcional equivalente | Preservar |
| /privacidade.html | /privacidade/ | 301 após validação legal |
| /privacy.html | /en/privacy/ | 301 após validação legal |
| /termos.html | /termos/ | 301 após validação legal |
| /terms.html | /en/terms/ | 301 após validação legal |
| /source-ao/index.html | Manter até validar a arquitetura pública e o destino do Source AO | Preservar |
| /source-ao/opportunity-radar.html | Manter até confirmar se continua público e indexável | Rever indexação |
| /source-ao/rfq.html | /source-ao/smart-rfq/ apenas se funcionalidade e conteúdo forem equivalentes | Rever |
| /source-ao/privacy.html | Manter até existir política equivalente no novo Source AO | Preservar |
| /source-ao/terms.html | Manter até existirem termos equivalentes no novo Source AO | Preservar |
| /coberturas-industriais.html | Página especializada recriada no preview em /coberturas-industriais/ e /en/industrial-roofing/; manter URL oficial até validar equivalência, Search Console e backlinks | Preservar até aprovação |
| /limpeza-pos-obra.html | Página especializada recriada no preview em /limpeza-pos-obra/ e /en/post-construction-cleaning/; manter URL oficial até validar equivalência, Search Console e backlinks | Preservar até aprovação |
| /fornecimento-de-epi-e-fardamento.html | Página especializada recriada no preview em /fornecimento-de-epi-e-fardamento/ e /en/ppe-workwear/; manter URL oficial até validar equivalência, Search Console e backlinks | Preservar até aprovação |
| /remodelacao-de-escritorios.html | Página especializada recriada no preview em /remodelacao-de-escritorios/ e /en/office-remodelling/; manter URL oficial até validar equivalência, Search Console e backlinks | Preservar até aprovação |
| /estaleiro-integrado.html | Página recriada no preview em /estaleiro/; manter a URL oficial até validar a equivalência e aprovar a migração | Preservar até aprovação |
| /integrated-yard.html | Página recriada no preview em /en/integrated-yard/; manter a URL oficial até validar a equivalência e aprovar a migração | Preservar até aprovação |

## Outras páginas HTML encontradas no repositório
Estas páginas não aparecem entre as 37 URLs do sitemap consultado, mas devem ser verificadas no Search Console e nos logs antes de decidir o seu destino:
- /hmatias-clean.html
- /hmatias-clean-en.html
- /politica-privacidade.html
- /termos-condicoes.html
- /procura.html

## Rotas novas já presentes na estrutura Astro
Na revisão atual, o protótipo gera 44 páginas estáticas, organizadas em 22 pares PT/EN. A cobertura inclui páginas institucionais, Construção, Facilities, Supply, HMATIAS Clean, Business Services, Catálogo de Obras, Blog, Smart RFQ, páginas especializadas de serviços, KARTA e Estaleiro Integrado. A existência de uma rota no preview não autoriza eliminar ou redirecionar uma URL antiga sem confirmar a equivalência, os dados de tráfego e os backlinks.

## Dados ainda necessários antes de fechar o mapa definitivo
- Exportação do Search Console: páginas indexadas e respetivas impressões, cliques, CTR e posição.
- Relatório de links externos/backlinks por URL.
- Verificação de páginas que recebem tráfego direto, de anúncios ou de referências.
- Confirmação do destino funcional dos formulários antigos, agendamento, KARTA, HMATIAS Clean e páginas específicas de serviços.

## Plano de execução da migração
1. Fechar conteúdo e QA das páginas de serviço e institucionais.
2. Obter o inventário real do Search Console e completar o mapeamento URL a URL.
3. Construir e testar as páginas legadas sem equivalente, ou manter os seus URLs no deploy final.
4. Preparar regras 301 diretas e testar cada origem/destino.
5. Gerar sitemap final apenas com destinos canónicos indexáveis e hreflang válido.
6. Testar robots.txt, canonicals, hreflang, structured data, formulários e tracking.
7. Aprovar janela de migração, publicar no domínio atual e submeter o sitemap atualizado na mesma propriedade do Search Console.
8. Monitorizar diariamente os primeiros 14 dias e semanalmente durante pelo menos 6 semanas.

**Bloqueio de segurança:** a pré-visualização continua noindex. Não remover o noindex, não trocar DNS, não substituir o sitemap de produção e não publicar redirects até à aprovação explícita da migração.


## Páginas especializadas recriadas no preview
- /coberturas-industriais.html → /coberturas-industriais/ ↔ /en/industrial-roofing/
- /limpeza-pos-obra.html → /limpeza-pos-obra/ ↔ /en/post-construction-cleaning/
- /fornecimento-de-epi-e-fardamento.html → /fornecimento-de-epi-e-fardamento/ ↔ /en/ppe-workwear/
- /remodelacao-de-escritorios.html → /remodelacao-de-escritorios/ ↔ /en/office-remodelling/

Os destinos acima existem apenas no preview. Os URLs históricos mantêm-se no domínio oficial até conclusão da revisão de Search Console/backlinks, aprovação da equivalência e autorização explícita para redirects.
