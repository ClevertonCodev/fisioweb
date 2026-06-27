---
name: laravel-queues
description: Sistema de filas (Jobs) no Laravel modular do fisioweb. Use para criar processamento async — envio de WhatsApp, geração de PDF, upload para Cloudflare R2, processamento de vídeo, e-mail. Cobre criação de Job com retry/backoff/failed, dispatch (immediate/delayed/afterCommit), Jobs únicos para evitar duplicação, Job middleware para rate limit, testes com Queue::fake e assertPushed.
metadata:
  domain: framework
  triggers: job, queue, fila, async, dispatch, ShouldQueue, retry, backoff, Bus, Horizon, afterCommit, WhatsApp, PDF
  scope: implementation
  output-format: code
  related-skills: backend-clean-code, architecture-paradigm-modular-monolith, backend-module, laravel-eloquent, php-testing
---

# Laravel Queues (fisioweb)

Padrão de Jobs/Queue do projeto. Referência real: `modules/WhatsApp/app/Jobs/SendWhatsAppMessageJob.php`.

## Quando usar

- Envio de WhatsApp/SMS/e-mail.
- Geração de PDF (módulo `Pdf`).
- Upload de arquivo para Cloudflare R2 (módulo `Cloudflare`).
- Processamento de vídeo / mídia (módulo `Media`).
- Qualquer operação que não precisa bloquear o request HTTP.
- Reação a evento de Model (Observer dispara Job) — ver [`laravel-eloquent`](../laravel-eloquent/SKILL.md).
- Consequência assíncrona em outro módulo — primeiro carregue [`architecture-paradigm-modular-monolith`](../architecture-paradigm-modular-monolith/SKILL.md) para decidir evento, payload e ownership.

## Contexto do projeto

- `composer run dev` já inicia o queue listener.
- Connection default = `QUEUE_CONNECTION` do `.env` (Redis em prod, `sync` em testes via `phpunit.xml`).
- Job de referência: [`modules/WhatsApp/app/Jobs/SendWhatsAppMessageJob.php`](../../../modules/WhatsApp/app/Jobs/SendWhatsAppMessageJob.php).
- Helpers globais: `logInfo`, `logWarning`, `logError` definidos em `app/Helpers/utils.php`. Use no `handle()` e `failed()`.
- Sem Horizon configurado hoje. Worker simples basta.
- Job dispatch a partir de Observer já em uso (`TreatmentPlanObserver` → `SendWhatsAppMessageJob`).
- Jobs executam trabalho; eles não substituem contrato entre módulos. Para reação cross-module, use evento de domínio/integração e listener/job no módulo consumidor.
- Listener/Job deve chamar Service do próprio módulo e seguir [`backend-clean-code`](../backend-clean-code/SKILL.md); não coloque regra grande ou query cross-module direto no Job.

## Core mandates

### Deve fazer
- Implementar `ShouldQueue` (não `ShouldQueue` + `ShouldBeUnique` sem motivo).
- Usar todas as traits: `Dispatchable, InteractsWithQueue, Queueable, SerializesModels`.
- Promover dependências no construtor: `public function __construct(public string $to, public string $body) {}`.
- Tipar `handle()` injetando a `Interface` do Service — Laravel resolve via container.
- Definir `$tries` e `$backoff` (array com exponential backoff).
- Implementar `failed(\Throwable $e)` com `logError(...)`.
- Usar `dispatch()` (estático) com named arguments — `SendWhatsAppMessageJob::dispatch(to: ..., body: ...)`.
- Usar `->afterCommit()` quando dispatch acontece dentro de `DB::transaction` ou Observer `created`.

### Não deve fazer
- Injetar Repository/Service no construtor — eles **serão serializados** com o job. Resolva no `handle()`.
- Fazer query pesada dentro de `__construct()` — construtor roda no dispatch, não no worker.
- Passar Eloquent Model não persistido — serialização confia em `id`. Use o `id` ou salve antes.
- Passar Model Eloquent de outro módulo como payload de integração — use IDs/snapshot mínimo.
- Esquecer `failed()` — silenciar erro de job é dívida operacional.
- Disparar Job dentro de Observer `creating()` — model ainda não tem `id`. Use `created()`.
- Disparar Job dentro de `DB::transaction` sem `afterCommit()` — pode rodar antes do commit e ler dado inexistente.

## Reference Guide

| Tópico | Referência | Carregar quando |
|--------|-----------|-----------------|
| Padrões completos (Job, dispatch, batching, unique, middleware, testes) | [`references/queues.md`](references/queues.md) | Implementar/testar Job |
| Responsabilidade de Job, Listener e Service | [`../backend-clean-code/SKILL.md`](../backend-clean-code/SKILL.md) | Evitar Job com regra de negócio ou dependência concreta |
| Evento/listener atravessa módulos backend | [`../architecture-paradigm-modular-monolith/SKILL.md`](../architecture-paradigm-modular-monolith/SKILL.md) | Definir evento, payload e módulo consumidor |
| Disparar Job de Observer | [`../laravel-eloquent/SKILL.md`](../laravel-eloquent/SKILL.md) | Reagir a evento de Model |
| Testar Job dispatch | [`../php-testing/SKILL.md`](../php-testing/SKILL.md) | `Queue::fake()` + `assertPushed` |
| Estrutura de módulo | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) | Localização do Job no módulo |

## Output esperado

Ao criar Job novo, entregue:

1. **Job class** em `modules/<Module>/app/Jobs/<Verbo><Substantivo>Job.php`.
2. **`$tries`, `$backoff`** definidos.
3. **`handle()`** com dependência injetada via Interface.
4. **`failed()`** com `logError` e contexto suficiente para debug.
5. **Dispatch** no Service/Observer com named arguments + `afterCommit()` se necessário.
6. **Feature test** usando `Queue::fake()` + `Queue::assertPushed(MyJob::class, fn($job) => ...)`.

## Quick decision

| Cenário | Use |
|---------|-----|
| Notificar paciente após criar plano de tratamento | `SendWhatsAppMessageJob::dispatch(...)` no Observer `created` |
| Gerar PDF de relatório longo | Job dedicado, salvar em R2, notificar quando pronto |
| Upload de arquivo grande (vídeo de exercício) | Job que faz upload via `CloudflareR2Service` |
| Reenviar com backoff exponencial | `$backoff = [10, 30, 60];` |
| Não pode duplicar (paciente A só pode ter 1 lembrete pendente) | `implements ShouldBeUnique` + `uniqueId()` |
| Rate-limit externo (API Twilio max 10/s) | Job middleware `RateLimited` ou `Redis::throttle` |
| Dispatch dentro de `DB::transaction` | Sempre `->afterCommit()` |
| Job que falha sem retentar (regra de negócio) | Lançar `\Throwable` em `handle()` + lógica em `failed()` |
| Encadear (gerar PDF → fazer upload → notificar) | `Bus::chain([...])->dispatch()` |
| Processar lote (re-indexar 1000 pacientes) | `Bus::batch([...])->dispatch()` |
