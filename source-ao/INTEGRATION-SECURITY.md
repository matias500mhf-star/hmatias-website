# SOURCE AO — integração segura por etapas

## Decisão técnica

O frontend público continua a comunicar com o Worker da Cloudflare definido em `source-ao/runtime-config.js`. Não adicionar o SDK de um gateway externo diretamente às páginas públicas até o respetivo contrato, ambiente e autorização estarem confirmados.

O cliente público `source-ao/api-client.js` é deliberadamente de leitura. Os formulários de sourcing usam os percursos existentes do backend, que aplicam validação, limites de pedidos, consentimento e referências privadas de acompanhamento.

## Fases recomendadas

1. **Base pública (atual):** pesquisa do índice, plano de pesquisa inteligente, missão de procurement, oportunidades públicas e estado de saúde.
2. **Captação:** manter o registo de RFQ através de `POST /api/sourcing-requests`; validar confirmação de gravação e ligação privada antes de mostrar sucesso.
3. **Gateway externo (pendente de validação):** documentar a URL de produção, autenticação suportada, formatos de pedido/resposta, CORS, limites, comportamento de erros e política de retenção. Não usar uma URL de desenvolvimento como destino de produção.
4. **Sincronização e eventos em tempo real (futuro):** definir primeiro a origem oficial dos dados, regras de conflito, idempotência, reconexão, autorização por função e auditoria. Não ativar escrita/sincronização apenas por instalar um SDK.
5. **Ativação gradual:** validar em staging com dados fictícios, aprovar testes de segurança e só depois planear uma publicação de produção separada.

## Segredos e credenciais

- Nunca guardar palavras-passe, tokens administrativos ou chaves privadas em HTML, JavaScript público, ficheiros de configuração públicos ou histórico Git.
- Guardar segredos apenas nos secrets do ambiente de execução apropriado (Cloudflare Worker ou GitHub Environment com acesso mínimo).
- Se uma credencial real foi incluída num snippet público ou partilhada fora do canal protegido, revogá-la/rodá-la antes de ativar a integração. Mudar a palavra-passe mais tarde não elimina cópias já expostas.
- Não reutilizar uma palavra-passe de administrador como chave de API. Usar credenciais distintas, limitadas e revogáveis.
- Não enviar RFQs reais, sincronizar registos reais ou executar migrações como parte de testes de integração.

## Critérios para aprovar o gateway

Antes de ligar um gateway externo, confirmar:
- domínio e ambiente de produção controlados pela organização;
- documentação oficial e versão do SDK;
- autenticação server-to-server ou mecanismo público seguro suportado;
- permissões separadas para leitura, escrita e administração;
- validação de origem, CORS, rate limiting e respostas sem dados privados;
- testes de saúde, falhas, duplicados, timeout e recuperação;
- procedimento de rotação/revogação de credenciais e plano de reversão.

## Limite desta fase

Esta documentação e o workflow de segurança não ativam qualquer gateway, não validam credenciais externas e não alteram a base de dados. A ativação depende de um contrato de API confirmado e de credenciais colocadas diretamente no ambiente protegido, nunca nesta conversa.
