# Continuidade do website HMATIAS — 10 outubro 2026

Base reconciliada: `d7bb1a232bf2b7c0d292d9c6104e419ed9ead259`.
Esta revisão preserva a infraestrutura, fotografias, estrutura da homepage e as quatro áreas principais.

## Confirmado antes desta alteração

- O domínio servia os mesmos bytes do `main` nas páginas e scripts críticos examinados: homepage, RFQ PT/EN, página institucional, Business Services, Termos, catálogo, cliente de leads e robots.
- O catálogo público já não continha o protótipo modular sem fotografias. Conservava os 12 registos visuais. O assistente ainda fazia referência ao conceito removido.
- A publicação GitHub Pages da base passou: execução `38013667878`, incluindo integridade, qualidade, publicação e verificação em produção. As notificações de falha de outro projecto Cloudflare não demonstravam falha desta publicação.
- Resend: domínio verificado, envio permitido, nenhum email encontrado na consulta dos últimos envios.
- Diagnóstico actualizado em 10/10 às 07:32 de Luanda: captação institucional desactivada; D1/encriptação e autenticação administrativa presentes; segredo Turnstile e chave Resend ausentes no Worker; chave Resend ausente no ambiente GitHub. Execução `37955254511`, nova tentativa, trabalho `114152528644`.

## Alterações desta revisão

- Sobre nós/About conduz à página institucional existente; a homepage ganha ligação textual à missão e aos valores, conservando o seu desenho.
- Página institucional PT/EN com apresentação corporativa, valores explicados e quatro áreas preservadas.
- Removida a entrada redundante Divisões nos menus que já conduziam à mesma secção de Serviços.
- Smart RFQ mantém os campos técnicos e oferece encaminhamento próprio para Business Services. Corrigidos os fragmentos antigos do rodapé inglês.
- Agendamento PT/EN e respostas locais do assistente deixam de promover vistos/apoio consular. Conhecimento do assistente deixa de apresentar o protótipo modular como conteúdo do catálogo.
- Supply passa a apresentar revisão, ligação de WhatsApp, ligação de email e cópia integral depois de preparar o pedido. Deixa de depender de popup; alterações aos dados invalidam o texto preparado.
- Resumo RFQ português utiliza apenas origem/caminho, como a versão inglesa, sem incluir parâmetros da ligação.
- Linguagem profissional no RFQ e rótulos portugueses do Source AO; pesquisa, fontes, APIs e critérios comerciais preservados.
- Cache de scripts e datas do sitemap actualizadas; verificações de navegação alinhadas com o acesso institucional aprovado, mantendo Credibilidade no rodapé.

## Validação e limites

Verificações locais: integridade das 31 URLs canónicas, 82 rotas WhatsApp, 1 205 referências a ficheiros/links, auditoria dos formulários, sintaxe JavaScript e consistência do diff. A integração exige CI e a publicação deve ser confirmada no domínio após merge; este registo, por si só, não comprova publicação.

O frontend não activa a captação, não envia emails, não cria contactos no CRM e não assume uma referência local como pedido recebido. O diagnóstico já existente em `docs/HMATIAS-CONFIGURAR-TURNSTILE-RESEND-2026-10-09.md` continua aplicável: instalar as credenciais limitadas no ambiente protegido e validar recepção antes de activar a função. Nenhum segredo deve ser fornecido no chat ou incluído no repositório.

Source AO continua a depender do índice/fontes configurados; a pesquisa externa assistida mantém as dependências documentadas em `docs/SOURCE-AO-AI-PILOT-2026-10-09.md`. Não se declara pesquisa de mercado por IA ou stock em tempo real sem configuração e prova de execução. Indexação efectiva Google/ChatGPT não está demonstrada pelo sitemap ou por esta publicação.
