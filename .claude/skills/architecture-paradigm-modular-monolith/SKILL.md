---
name: architecture-paradigm-modular-monolith
description: Projetar e evoluir o fisioweb como monolito modular com fronteiras fortes, contratos publicos entre modulos e arquitetura orientada a eventos. Use ao criar ou refatorar modulos Laravel/React, mover responsabilidades entre bounded contexts, evitar acoplamento direto entre modules/*, definir eventos de dominio/integracao, criar ADRs de arquitetura, planejar fitness tests de dependencia, ou preparar um modulo para possivel extracao futura como microservico sem distribuir o sistema antes da hora.
---

# Architecture Paradigm: Modular Monolith

Use esta skill como criterio arquitetural antes de implementar features que atravessam mais de um modulo. O objetivo e manter um unico deploy Laravel + React, mas tratar `modules/<Module>` como bounded contexts com contratos explicitos e minimo conhecimento interno entre si.

## Principios

- Manter um unico artefato deployavel enquanto isso reduzir complexidade operacional.
- Alinhar modulos a capacidades de negocio, nao a camadas tecnicas.
- Fazer cada modulo possuir seus dados, modelos, services, policies, rotas e eventos.
- Permitir colaboracao entre modulos apenas por contratos publicos, facades/application services, DTOs ou eventos.
- Proibir acesso direto a models, repositories, migrations ou tabelas privadas de outro modulo quando a feature puder usar contrato/evento.
- Tratar microservico como opcao futura, nao como objetivo imediato.

## Workflow

1. Mapear a mudanca para uma capacidade de negocio: Admin, Clinic, Patient, Media, Pdf, Cloudflare, WhatsApp ou novo modulo.
2. Definir ownership: qual modulo e dono da regra, dos dados e da decisao final.
3. Escolher o tipo de colaboracao:
   - Chamada sincrona por contrato quando o chamador precisa da resposta agora.
   - Evento de dominio/integracao quando a consequencia pode ocorrer depois ou pertence a outro modulo.
   - Read model/projecao quando um modulo precisa consultar dados derivados sem controlar a regra de origem.
4. Implementar dentro do modulo dono usando as skills tecnicas existentes.
5. Expor somente o necessario para fora do modulo.
6. Registrar a decisao quando houver nova fronteira, excecao ou caminho para extracao.
7. Adicionar teste ou checagem que proteja a fronteira se o risco de regressao for relevante.

## Skill Map

| Estou fazendo | Carregue tambem |
|--------------|-----------------|
| CRUD/backend dentro de um modulo | [`backend-module`](../backend-module/SKILL.md) |
| Entidade, relacionamento, query ou transacao | [`laravel-eloquent`](../laravel-eloquent/SKILL.md) |
| Job async ou listener com fila | [`laravel-queues`](../laravel-queues/SKILL.md) |
| DTO, Enum, Value Object ou contrato tipado | [`php-modern`](../php-modern/SKILL.md) |
| Policy/ownership multi-tenant | [`security`](../security/SKILL.md) |
| Feature React que consome contrato HTTP | [`frontend-ddd`](../frontend-ddd/SKILL.md), [`api-client`](../api-client/SKILL.md) |
| Teste de fronteira/backend | [`php-testing`](../php-testing/SKILL.md) |

## Boundary Rules

- `modules/<Owner>/app/Models/*` pertence ao modulo dono. Outro modulo nao deve importar o model para regra de negocio.
- Repositories sao internos ao modulo. Exponha ServiceInterface, Facade de aplicacao, DTO ou evento.
- Tabelas tem dono unico. Outro modulo nao escreve nelas diretamente.
- Shared code deve ser pequeno, estavel e tecnico. Nao colocar regra de negocio em `app/` ou helpers globais para "compartilhar".
- Eventos carregam identificadores e snapshots minimos, nao modelos Eloquent completos.
- O frontend continua seguindo DDD: pages/loaders falam com `application/`; `infrastructure/` conhece HTTP; `domain/` fica puro.

## Decision Matrix

| Situacao | Preferir |
|----------|----------|
| Precisa validar autorizacao ou regra critica | Chamada sincrona ao modulo dono |
| Precisa enviar WhatsApp, gerar PDF, sincronizar midia, auditar, notificar | Evento + listener/job |
| Precisa exibir dados de outro modulo em tela | Endpoint do modulo dono ou read model |
| Precisa alterar dados de outro modulo na mesma transacao | Reavaliar fronteira; se inevitavel, documentar ADR |
| Precisa compartilhar enum/valor estavel | Value Object/Enum em contrato publico ou pacote compartilhado minimo |
| Precisa "so fazer join" em tabela de outro modulo | Evitar; criar consulta publica/read model |

## References

| Tema | Referencia | Carregar quando |
|------|------------|-----------------|
| Fronteiras, contratos e ADR | [`references/boundaries.md`](references/boundaries.md) | Criar/refatorar modulo ou dependencia entre modulos |
| Eventos internos e EDA | [`references/events.md`](references/events.md) | Definir evento, listener, job ou consistencia eventual |
| Prontidao para microservico | [`references/extraction-readiness.md`](references/extraction-readiness.md) | Planejar extracao futura ou reduzir acoplamento |

## Output Esperado

Ao propor ou implementar uma mudanca arquitetural, entregue:

1. Modulo dono e modulos consumidores.
2. Contrato publico escolhido: ServiceInterface, endpoint, DTO, evento ou read model.
3. Regra de dependencia: quem pode chamar quem e por qual caminho.
4. Impacto em dados: tabela dona, escrita permitida, leitura permitida, transacao ou consistencia eventual.
5. Teste/checagem para proteger a decisao quando aplicavel.
6. ADR curto quando a decisao cria uma fronteira nova, excecao importante ou trade-off duradouro.
