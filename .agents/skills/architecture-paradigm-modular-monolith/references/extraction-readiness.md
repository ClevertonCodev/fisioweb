# Extraction Readiness

Microservico e uma opcao de evolucao, nao uma meta inicial. Preparar extracao significa reduzir acoplamento sem pagar custo distribuido agora.

## Extraction Readiness Checklist

- O modulo backend tem dono de dados claro.
- Outros modulos usam contratos publicos, endpoints, DTOs, eventos ou read models.
- Nao ha imports frequentes para Models/Repositories internos.
- Transacoes que atravessam modulos sao raras, conhecidas e documentadas.
- Eventos importantes tem payload estavel e listeners idempotentes.
- Testes de contrato cobrem interacoes principais.
- Consumers externos ao modulo dependem de contratos publicos, nao de internals.

## Split Candidate Signals

Considere extracao quando varios sinais aparecerem juntos:

- Escala operacional diferente do resto do sistema.
- Equipe separada precisa evoluir modulo com autonomia real.
- Deploy independente reduz risco/ciclo de entrega.
- Modelo de dados e contratos ja estao estaveis.
- Custo de latencia, rede e observabilidade e aceitavel.

Nao extrair apenas porque o modulo "parece grande". Primeiro melhorar fronteiras internas.

## Pre-Extraction Refactor Order

1. Remover imports diretos para internals do modulo candidato.
2. Criar contratos publicos e DTOs para casos sincronos.
3. Transformar efeitos secundarios em eventos/listeners.
4. Separar ownership de tabela e eliminar escritas cruzadas.
5. Criar testes de contrato e testes de evento.
6. Medir pontos que exigiriam API externa, outbox, retry e observabilidade.

## Future Distributed Concerns

Se um modulo virar microservico depois, planejar:

- Autenticacao/autorizacao entre servicos.
- Contratos HTTP ou mensageria versionados.
- Outbox/inbox para entrega confiavel de eventos.
- Idempotencia obrigatoria em consumidores.
- Observabilidade: logs correlacionados, tracing, metricas.
- Consistencia eventual explicita para fluxos do usuario.
