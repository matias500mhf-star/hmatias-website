# HMATIAS — Nova fase institucional e operacional

## Estado de implementação
- Branch: `feat/institutional-operating-phase-20261106`
- Base: `main`
- Estado: preparação não publicada; páginas com `noindex,nofollow`.
- A homepage pública de `main` não foi alterada. Nesta branch de pré-visualização, `index.html` serve a versão experimental premium no ambiente de teste; não deve ser integrada/publicada em produção sem aprovação.
- Nenhuma alteração foi feita em `main`, domínio, DNS ou configuração de publicação.

## Novas áreas
- `equipa.html`: perfis de colaboradores, alimentados por `data/team.json`.
- `parceiros.html`: rede estratégica e fornecedores, alimentados por `data/partners.json`.
- `catalogo-fornecimentos.html`: catálogo de sourcing, alimentado por `data/supply-catalog.json`.

## Critérios de integridade
1. Não inventar nomes, cargos, qualificações, fotografias ou experiência dos colaboradores.
2. Publicar fotografia apenas com autorização e imagem real aprovada.
3. Distinguir parceiro formal, colaboração aceite, fornecedor e relação comercial em desenvolvimento.
4. Não usar logótipos sem ficheiro oficial correcto e autorização.
5. Não afirmar stock, preço, exclusividade, representação ou disponibilidade sem confirmação actual.
6. As categorias gerais de sourcing não equivalem a produtos homologados ou stock próprio.
7. Não divulgar contactos pessoais, descontos negociados ou notas internas no website ou nos dados públicos.

## Estado dos registos iniciais
- Kent Offshore: relação de colaboração e sourcing industrial confirmada pela gerência; sem exclusividade ou stock actual garantido.
- SYNVOR Industrial: fornecedor especializado; relação comercial em desenvolvimento; não classificar como parceria formal concluída.
- TELEWISE: colaboração técnica/comercial não exclusiva aceite; escopo e condições são definidos por intervenção.
- Outras relações comerciais permanecem fora da página até existir base documental e autorização adequadas.

## Catálogo
A primeira família técnica detalhada usa o catálogo comercial SYNVOR 2026 como referência documental para Carbodiam/Samedia, Red Line 17, Spyrostar, PRO BF1 e coroas diamantadas. Todos os itens permanecem sujeitos a RFQ e confirmação actual.
As demais famílias são categorias de sourcing sob consulta, sem alegação de stock ou homologação.

## Dados a recolher antes da publicação
### Equipa
- Nome completo e grafia aprovada
- Cargo real e departamento
- Biografia profissional curta
- Competências comprováveis
- Fotografia individual em alta resolução
- Consentimento escrito para publicação
- Aprovação final do titular e da gerência

### Parceiros
- Autorização escrita para nome/logótipo e descrição
- Nome legal e URL oficial
- Texto aprovado pela entidade
- Escopo, status, região e limitações da colaboração
- Contacto público autorizado, se aplicável

### Produtos
- Referência exacta, marca e fabricante
- Ficha técnica e certificações
- Preço, disponibilidade, prazo e origem actual
- Condições de entrega e validade da cotação
- Direitos de utilização de imagens e logótipos

## Próxima revisão
Rever integração no menu de páginas existentes, acessibilidade, mobile, links, dados JSON, performance, metadados e testes visuais antes de criar um pull request de revisão. Não fazer merge nem publicar sem aprovação explícita.
