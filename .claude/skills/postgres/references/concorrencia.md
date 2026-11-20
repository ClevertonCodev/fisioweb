# Concorrência e locks

Duas requisições, ou dois workers da fila, mexendo no mesmo registro. O SQLite dos testes não reproduz quase nada disto: lock por linha, `SKIP LOCKED` e deadlock se conferem no Postgres do Docker, com duas sessões do `fisio-app psql` ou dois `queue:work`.

## Transação curta, sem chamada externa dentro (MÉDIO-ALTO)

O lock fica preso até o `commit`. Se dentro da transação houver chamada HTTP (R2, Google Calendar, WhatsApp), e-mail ou geração de PDF, todo mundo que precisa daquela linha espera junto.

**Incorreto:**

```php
DB::transaction(function () use ($transactionId, $file): void {
    $transaction = FinancialTransaction::query()->lockForUpdate()->findOrFail($transactionId);
    $path = $this->storage->upload($file); // upload ao R2 com o lançamento travado
    $transaction->attachments()->create(['path' => $path]);
});
```

**Correto:**

```php
$path = $this->storage->upload($file);

DB::transaction(function () use ($transactionId, $path): void {
    $transaction = FinancialTransaction::query()->lockForUpdate()->findOrFail($transactionId);
    $transaction->attachments()->create(['path' => $path]);
});
```

- Se a transação falhar, apague o arquivo que já subiu. É o que o `FinancialAttachmentService::upload()` faz.
- Efeito colateral depois do `commit` (e-mail, job) vai com `afterCommit` (ver [`laravel-queues`](../../laravel-queues/SKILL.md)).

## `lockForUpdate` só quando ler e depois escrever (MÉDIO-ALTO)

Quando a decisão depende do valor lido (status, saldo, quantidade), trave a linha na leitura, dentro da transação:

```php
DB::transaction(function () use ($transactionId): void {
    $transaction = FinancialTransaction::query()->lockForUpdate()->findOrFail($transactionId);

    if ($transaction->status !== FinancialTransactionStatus::Pendente) {
        throw new DomainException('Lançamento já baixado.');
    }

    $transaction->update(['status' => FinancialTransactionStatus::Pago]);
});
```

Quando dá para fazer numa instrução só, prefira: `FinancialTransaction::whereKey($id)->where('status', 'pendente')->update(['status' => 'pago'])` e confira se uma linha foi afetada. O `where('status', 'pendente')` é o que impede baixar duas vezes: a segunda requisição atualiza 0 linhas.

## Evite deadlock: trave sempre na mesma ordem (MÉDIO-ALTO)

A transação A trava a linha 1 e espera a 2, enquanto a B trava a 2 e espera a 1. O Postgres mata uma das duas com erro de deadlock.

**Correto:** trave todas as linhas de uma vez, ordenadas pela chave:

```php
DB::transaction(function () use ($ids): void {
    $transactions = FinancialTransaction::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
    // ...
}, attempts: 3);
```

O segundo argumento do `DB::transaction` (`attempts`) repete a transação quando ela cai por deadlock ou erro de concorrência. Use em transação que pode colidir, e só se ela não tiver efeito fora do banco.

## Vários workers no mesmo trabalho: `SKIP LOCKED` (MÉDIO-ALTO)

Com `lockForUpdate` comum, o segundo worker espera o primeiro soltar a linha. Com `SKIP LOCKED`, ele pula a linha travada e pega a próxima.

- **A fila do Laravel já faz isso.** Com `QUEUE_CONNECTION=database` no Postgres, o `DatabaseQueue` usa `FOR UPDATE SKIP LOCKED`. Trabalho assíncrono vai para um Job, não para uma tabela de "pendentes" feita à mão.
- Se precisar mesmo (ex.: separar um lote de vídeos pendentes para processar):

```php
DB::transaction(function (): void {
    $batch = Video::query()
        ->where('status', Video::STATUS_PENDING)
        ->orderBy('id')
        ->limit(50)
        ->lock('for update skip locked')
        ->get();

    Video::query()->whereKey($batch->modelKeys())->update(['status' => Video::STATUS_PROCESSING]);
});
```

O SQLite ignora a cláusula de lock, então o teste passa mesmo com dois workers pegando a mesma linha. Teste a concorrência no Docker.

## Lock de aplicação: `Cache::lock` ou advisory lock (MÉDIO)

Para "só um processo por vez faz X" (gerar o relatório diário, sincronizar a agenda de um profissional com o Google Calendar) não crie tabela de lock.

- **Primeira opção:** `Cache::lock('google-calendar-pull-'.$clinicUserId, 120)->get(fn () => ...)`. Funciona em qualquer banco (o `ServiceTypeService` já usa assim), e o Job tem o `WithoutOverlapping` (ver [`laravel-queues`](../../laravel-queues/SKILL.md)).
- **No Postgres**, o advisory lock de transação é solto sozinho no `commit` ou `rollback`:

```php
DB::transaction(function () use ($clinicUserId): void {
    $acquired = DB::selectOne('select pg_try_advisory_xact_lock(?) as ok', [crc32('google-calendar-pull-'.$clinicUserId)])->ok;

    if (! $acquired) {
        return;
    }

    // trabalho exclusivo
});
```

## Conexões

Cada processo PHP (requisição ou `queue:work`) segura uma conexão. Mais workers da fila significam mais conexões. Uma transação esquecida aberta (`idle in transaction`) segura lock e conexão. Para ver o que está aberto: `select state, count(*) from pg_stat_activity group by state;`.
