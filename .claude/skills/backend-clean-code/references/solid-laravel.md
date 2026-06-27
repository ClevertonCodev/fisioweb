# SOLID and Clean Code Checklist for Laravel

Use este checklist antes de finalizar backend novo ou refatoracao em `modules/*`.

## Checklist Rapido

- Controller chama um Service/UseCase e nao contem query, transacao ou regra.
- FormRequest valida entrada e nao substitui Policy/Service.
- Service tem uma responsabilidade de caso de uso e depende de interfaces do proprio modulo ou contratos publicos definidos pela arquitetura.
- Repository contem Eloquent/SQL e nao contem regra de negocio.
- DTO readonly substitui array solto quando o payload tem varios campos ou atravessa camadas.
- Model/Entity tem apenas regra pequena do proprio estado.
- ServiceProvider registra todos os binds de interfaces usadas.
- Eventos representam fatos no passado e carregam IDs/snapshot minimo.
- Listener chama Service do proprio modulo.
- Nenhuma classe importa Model/Repository interno de outro modulo para regra de negocio.

## Decisoes De Onde Colocar Codigo

| Pergunta | Lugar |
|----------|-------|
| E entrada HTTP, status code ou envelope JSON? | Controller |
| E validacao de campos enviados? | FormRequest |
| E caso de uso com regra, transacao, evento ou autorizacao de negocio? | Service/UseCase |
| E query, filtro, eager loading ou persistencia? | Repository |
| E regra curta sobre o estado da propria entidade? | Model/Entity |
| E efeito depois que algo aconteceu? | Event + Listener/Job |
| E dependencia de SDK externo? | Service/Gateway interno do modulo dono |

## Heuristicas De Refatoracao

- Se o Controller passa de orquestracao HTTP, mover para Service.
- Se o Service tem varias consultas repetidas, mover consultas para Repository.
- Se o Repository precisa perguntar "pode?" ou "deve?", mover decisao para Service ou Policy.
- Se um metodo recebe array e acessa 5+ chaves, criar DTO.
- Se um `if` por status/tipo cresce, considerar Enum com metodo ou estrategia.
- Se uma acao dispara tres consequencias, manter a acao no Service e mover consequencias para eventos/listeners.
- Se uma classe precisa importar Model/Repository de outro modulo, parar e carregar `architecture-paradigm-modular-monolith`.

## Anti-Patterns Proibidos

```php
// Controller gordo
DB::table('appointments')->where('id', $id)->update(['status' => 'cancelled']);
```

```php
// Service retornando resposta HTTP
return response()->json(['data' => $result]);
```

```php
// Repository decidindo regra de negocio
if ($reservation->status === 'paid') {
    throw new DomainException('Cannot cancel paid reservation');
}
```

```php
// Evento com Model como contrato
event(new ReservationCreated($reservation));
```

Prefira:

```php
event(new ReservationCreated(
    reservationId: $reservation->id,
    customerId: $reservation->customer_id,
    occurredAt: now()->toImmutable(),
));
```

## Testes Esperados

- Feature test garante rota, guard, validacao e envelope de resposta.
- Unit test do Service cobre regra de negocio com mocks das interfaces.
- Unit test de Model/Entity cobre metodos pequenos como `cancel()` ou `canRefund()`.
- Listener/job tem teste isolado com evento fake e idempotencia quando houver side effect.
- Fitness test de arquitetura bloqueia imports proibidos entre modulos quando a fronteira for critica.
