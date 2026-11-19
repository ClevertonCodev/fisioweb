# ADR: Toda falha definitiva de job na fila grava uma linha no canal de log `queue`, por um ouvinte global

**Status:** proposto em 2026-11-18. Ainda não implementado.

## Contexto

A fila do fisioweb roda no driver `database` (`QUEUE_CONNECTION=database`). Os
jobs mandam WhatsApp, e-mail, PDF, upload para o R2 e sincronizam com o Google
Agenda. Quando um job gasta todas as tentativas, o Laravel grava a falha na
tabela `failed_jobs`, mas não escreve nada no log. Para descobrir que algo
falhou, alguém precisa rodar `php artisan queue:failed` no servidor ou consultar
a tabela.

Hoje só quatro jobs tratam a própria falha com o método `failed()`:

- `modules/ClinicScheduling/app/Jobs/AppointmentScheduledNotificationJob.php`
- `modules/GoogleCalendar/app/Jobs/PullGoogleCalendarJob.php`
- `modules/GoogleCalendar/app/Jobs/SyncAppointmentToGoogleJob.php`
- `modules/Clinic/app/Jobs/SendClinicEmailVerificationJob.php`

Os outros jobs falham sem log. Cada job novo precisaria lembrar de escrever o
próprio `failed()`.

O projeto já tem o log-viewer (`config/log-viewer.php`), que lê todo
`storage/logs/**/*.log`, e o `laravel/pail` para acompanhar o log em tempo real.

Alternativas consideradas:

- **Laravel Horizon:** só funciona com Redis. Trocar o driver da fila só para
  isso não compensa.
- **Laravel Nightwatch:** serviço pago e externo. Mandaria nomes de jobs e
  mensagens de erro, que podem conter dado de paciente, para fora do servidor.
- **`romanzipp/laravel-queue-monitor`:** grava cada execução numa tabela própria
  e tem uma tela. É mais do que precisamos agora, e exige migration e uma
  dependência nova.
- **Laravel Pulse:** painel de métricas. Mostra volume, mas não o motivo da
  falha.
- **Ouvinte global do evento `JobFailed`:** nativo do Laravel, sem dependência
  nem migration, e cobre todos os jobs de uma vez. É a escolha.

## Decisão

1. **Um ouvinte global com `Queue::failing`**, registrado no `boot()` do
   `app/Providers/AppServiceProvider.php`. A fila é infraestrutura de todos os
   módulos, então o ouvinte fica em `app/` e não dentro de um módulo de
   `modules/`. Ele não conhece nenhum job pelo nome.
2. **Um canal de log próprio, `queue`,** no `config/logging.php`, com driver
   `daily`, arquivo `storage/logs/queue.log` e retenção de
   `env('LOG_QUEUE_DAYS', 30)` dias. Fica fora do `laravel.log` para ser fácil de
   achar no log-viewer.
3. **Só a falha definitiva é logada.** O evento `JobFailed` dispara quando o job
   gasta todas as tentativas (`$tries`) ou falha com `fail()`. As tentativas
   intermediárias (`Queue::exceptionOccurred`) não entram, para o arquivo não
   encher de erro que se resolveu na tentativa seguinte.
4. **O que vai na linha**, no nível `error` e com a mensagem `Job falhou`:

   ```php
   Queue::failing(function (JobFailed $event) {
       try {
           Log::channel('queue')->error('Job falhou', [
               'job'        => $event->job->resolveName(),
               'uuid'       => $event->job->uuid(),
               'connection' => $event->connectionName,
               'queue'      => $event->job->getQueue(),
               'attempts'   => $event->job->attempts(),
               'exception'  => $event->exception::class,
               'erro'       => Str::limit($event->exception->getMessage(), 500),
               'onde'       => $event->exception->getFile().':'.$event->exception->getLine(),
           ]);
       } catch (Throwable) {
       }
   });
   ```

   O `uuid` liga a linha do log ao registro da `failed_jobs`, que guarda o
   payload e o stack trace completos para o `queue:retry`.
5. **Nunca logar o payload do job** (`$event->job->payload()`,
   `getRawBody()`) nem as propriedades do comando. Ali ficam dados de paciente,
   telefone, e-mail e tokens.
6. **Os `failed()` que já existem continuam.** Eles fazem trabalho do próprio
   job (marcar status, avisar alguém). O ouvinte global só registra, e os dois
   rodam.

## Consequências

**Benefícios**

- Toda falha de job aparece num lugar só (`storage/logs/queue-AAAA-MM-DD.log`),
  visível no log-viewer e no `php artisan pail`, sem consultar o banco.
- Job novo já nasce coberto, sem precisar escrever `failed()` para ter log.
- Sem dependência nova, sem migration e sem serviço externo.

**Custos**

- Não há alerta ativo: alguém precisa abrir o log. Um alerta (e-mail, Slack ou
  `queue:monitor` no scheduler para fila acumulada) pode vir depois, no mesmo
  ouvinte.
- A mensagem da exceção pode trazer dado pessoal (por exemplo, um erro de SQL
  com os valores da query). O corte em 500 caracteres reduz, mas não elimina. O
  log fica no servidor, protegido pelo log-viewer, que em produção exige
  `REMOTE_USER`.
- Se o próprio log falhar (disco cheio, permissão), a exceção do ouvinte não
  pode derrubar o worker. Por isso o ouvinte engole o erro de escrita (o
  `try/catch` do exemplo), e a falha continua registrada na `failed_jobs`.

**Regras que agentes devem preservar**

- Não logar payload, propriedades do job, nem dados do paciente no ouvinte.
- Não mover o ouvinte para dentro de um módulo nem fazer ele depender de classes
  de um módulo.
- Job novo não precisa de `failed()` só para logar; use `failed()` apenas quando
  o job tiver algo próprio a fazer na falha.
- Teste: disparar um `JobFailed` e conferir que o canal `queue` recebeu a linha
  com `job`, `uuid` e `exception`, e que nenhum campo do payload aparece.
