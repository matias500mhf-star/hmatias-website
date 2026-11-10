# Auditoria técnica do website HMATIAS — 10 de novembro de 2026

## Âmbito e método

Revisão estática da branch `design/2026-premium-experience`, incluindo 54 páginas HTML, referências internas, âncoras, imagens, formulários, metadados SEO, cabeçalhos de navegação, `robots.txt` e sitemap. Foram também revistos os controlos visíveis nas rotas operacionais Source AO.

Esta revisão não é um teste de intrusão nem substitui a análise do backend, do alojamento, das respostas HTTP ou dos dados reais submetidos pelos formulários.

## Resultado executivo

A estrutura HTML auditada não apresenta referências locais partidas nem problemas básicos de acessibilidade detetáveis pelo scan estático. O principal ponto a tratar é confirmar a classificação dos dados e documentos que fazem parte de um repositório público. As alterações visuais permanecem no PR de preview.

## Achados e prioridades

### P1 — Confirmar que os artefactos do repositório público podem ser públicos

O repositório é público e contém ficheiros operacionais e conjuntos de dados associados ao Source AO, além de documentação de trabalho sobre leads e fornecedores. O scan não publica aqui valores nem confirma que exista informação confidencial; a equipa deve classificar esses artefactos. Qualquer dado comercial, pessoal ou operacional que não seja destinado à publicação deve ser removido do histórico público e mantido num armazenamento privado apropriado.

### P1 — Não usar robots/noindex como controlo de acesso

As rotas internas de Source AO estão excluídas do sitemap e assinaladas para não indexação. O código revisto encaminha as operações de API com autenticação por bearer token, mas `robots.txt` e `noindex` apenas orientam crawlers; não impedem acesso aos ficheiros publicados. Confirmar que a autorização é aplicada no servidor a cada operação e que nenhum segredo ou dado privado é enviado no HTML ou JavaScript.

### P2 — Cobertura de metadados em páginas não principais

Nove páginas não têm meta description: a página 404, o índice do laboratório de design e sete páginas internas Source AO. Cinco páginas sem H1 são aliases, redirecionamentos ou documentos legais/noindex. Isto não bloqueia a navegação da homepage, mas convém manter as páginas publicáveis com título, descrição e hierarquia semântica próprios.

## Verificações estáticas

- 54 páginas HTML revistas.
- 0 referências locais partidas.
- 0 destinos de âncora inexistentes após correções nas páginas Supply e HMATIAS Clean.
- 0 imagens sem atributo `alt`.
- 0 IDs duplicados.
- 0 controlos de formulário sem rótulo detetados.
- 0 links `target="_blank"` sem os atributos de isolamento esperados.
- 0 páginas sem título.
- Rotas operacionais não aparecem no sitemap; a exclusão de crawlers não equivale a autenticação.

## Alterações visuais e navegação no PR

- Homepage com cabeçalho HMATIAS e acesso direto a Construção, Facilities, Supply e Business Services; versão inglesa alinhada.
- Fotografia principal com enquadramento revisto e tratamento visual azul institucional.
- Rodapé azul mantido, reorganizado com a coluna Explorar e ligações para Source AO, Blog e Projetos.
- Conteúdo genérico da homepage substituído por informação e percursos mais específicos.
- Ligações de pedido nas páginas Supply e Clean corrigidas para destinos válidos.

## Limitações da auditoria

A verificação de desempenho SEO via GSC Wizard não ficou disponível porque a subscrição de teste estava inativa. O relatório cobre o código e a estrutura estática observáveis no repositório; não certifica desempenho em todos os dispositivos, configuração de segurança do alojamento, permissões reais do backend nem conformidade jurídica.
