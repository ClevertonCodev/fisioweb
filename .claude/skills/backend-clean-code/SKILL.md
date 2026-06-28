---
name: backend-clean-code
description: Aplicar Clean Code, SOLID, inversao de dependencia e separacao de responsabilidades dentro de um modulo backend Laravel do fisioweb. Use ao criar ou refatorar Controllers, FormRequests, Services/UseCases, Repositories, DTOs, Models/Entities, Providers, listeners ou jobs, ou quando houver controller gordo, service fazendo query demais, repository com regra de negocio, arrays soltos, dependencia em classe concreta, ou duvida sobre onde colocar regra de negocio. Nao substitui architecture-paradigm-modular-monolith; quando houver fronteira ou acoplamento entre modules/*, use a skill de arquitetura junto.
---

# Backend Clean Code

Use esta skill como regra transversal de qualidade para codigo PHP/Laravel em `modules/*`. Ela complementa `backend-module`, `php-modern`, `laravel-eloquent`, `laravel-queues`, `security` e `architecture-paradigm-modular-monolith`.

## Regra De Ouro

- Controller nao pensa.
- FormRequest valida e normaliza entrada.
- DTO transporta dados.
- Service/UseCase decide e coordena o caso de uso.
- Entity/Model protege regra pequena do proprio estado.
- Repository busca e salva.
- Interface desacopla.
- Provider conecta interface a implementacao concreta.
- Evento anuncia fato ocorrido.

Fluxo preferido:

```text
Request
-> Controller
-> FormRequest
-> DTO
-> Service / UseCase
-> RepositoryInterface
-> Repository Eloquent
-> Database
```

## Responsabilidades

| Camada | Deve fazer | Nao deve fazer |
|--------|------------|----------------|
| Controller | Receber request validado, montar DTO, chamar Service/UseCase, retornar response | Query, `DB::table`, regra de negocio, transacao, chamada direta a outro modulo |
| FormRequest | Validar input, normalizar campos simples, mensagens de validacao | Decidir regra critica de negocio ou autorizacao complexa |
| DTO | Transportar dados tipados entre Controller e Service, ou entre modulos quando for contrato publico | Chamar banco, conter regra com dependencia externa |
| Service/UseCase | Orquestrar caso de uso, validar invariantes, abrir transacao local, disparar eventos, chamar RepositoryInterface do proprio modulo | Montar query Eloquent complexa, retornar JsonResponse, acessar tabela de outro modulo direto |
| Repository | Encapsular Eloquent/SQL, filtros, eager loading, persistencia | Regra de negocio, autorizacao, side effect externo |
| Model/Entity | Relacionamentos, casts, scopes simples, regra pequena do estado (`cancel()`, `isPaid()`, `canRefund()`) | Virar God Model com varias dependencias e workflows |
| Listener/Job | Reagir a evento, delegar para Service do proprio modulo, lidar com retry/idempotencia | Consultar Repository interno de outro modulo ou receber Model Eloquent como contrato |

## SOLID No Laravel

- **S - Single Responsibility**: uma classe deve ter um motivo principal para mudar. Se um Service valida permissao, gera PDF, salva financeiro e envia WhatsApp, separe casos de uso e eventos.
- **O - Open/Closed**: preferir estrategias, policies, enums com metodo e services especializados a `if` crescente por tipo/status.
- **L - Liskov**: implementacao concreta deve honrar a interface sem mudar contrato, excecoes esperadas ou significado do retorno.
- **I - Interface Segregation**: nao criar interface gigante. Separar leitura, escrita e acoes especificas quando consumidores precisam de partes diferentes.
- **D - Dependency Inversion**: Controller/Service depende de interface do proprio modulo ou contrato publico definido pela arquitetura, nao de Repository concreto, Model de outro modulo ou SDK externo.

Use o Service Container:

```php
$this->app->bind(
    ReservationRepositoryInterface::class,
    EloquentReservationRepository::class,
);
```

## Padroes Praticos

### Controller fino

```php
final class ReservationController
{
    public function cancel(CancelReservationService $service, int $id): JsonResponse
    {
        $service->execute($id);

        return response()->json(['success' => true]);
    }
}
```

Evitar no Controller:

```php
DB::table('reservations')->where('id', $id)->update(['status' => 'cancelled']);
```

### Service como caso de uso

```php
final class CancelReservationService
{
    public function __construct(
        private ReservationRepositoryInterface $reservations,
    ) {}

    public function execute(int $id): void
    {
        $reservation = $this->reservations->findById($id);
        $reservation->cancel();
        $this->reservations->save($reservation);
    }
}
```

### DTO para payload nao trivial

Use DTO quando o payload tiver varios campos, for passado entre camadas, ou precisar estabilidade.

```php
final readonly class CreateReservationData
{
    public function __construct(
        public int $customerId,
        public int $activityId,
        public string $date,
        public int $quantity,
    ) {}
}
```

### Eventos para desacoplar consequencias

Errado:

```php
$reservationService->create($data);
$emailService->send($reservation);
$commissionService->generate($reservation);
```

Melhor:

```php
event(new ReservationCreated(
    reservationId: $reservation->id,
    customerId: $reservation->customer_id,
    occurredAt: now()->toImmutable(),
));
```

Listeners ficam no modulo da consequencia: `SendReservationEmail`, `GenerateAffiliateCommission`, `UpdateReports`.

## Convencoes PHP

- Null: `is_null($x)` / `!is_null($x)` — nunca `=== null` / `!== null`.
- String vazia ou valor opcional de filtro/payload: `empty($x)` / `!empty($x)` — nunca `=== ''` / `!== ''`.

## Modulos E Fronteiras

- Dentro do mesmo modulo, `RepositoryInterface` e `ServiceInterface` podem ser contratos internos.
- Entre modulos, nao usar Model/Repository interno como atalho.
- Para cross-module, carregar `architecture-paradigm-modular-monolith` e escolher: ServiceInterface publico de aplicacao, DTO publico, Integration Event, endpoint ou read model.
- Tabela tem dono unico. Outro modulo nao escreve diretamente.
- Evento carrega IDs e snapshot minimo; nunca Model Eloquent completo.

## Smells Que Devem Ser Corrigidos

- Controller com `DB::`, `Model::query()`, `transaction()`, regra de status ou envio de notificacao.
- Service com `response()->json()`.
- Repository validando permissao, decidindo regra de negocio ou disparando evento de negocio.
- Interface retornando Model de outro modulo.
- DTO que embrulha array generico quando os campos do contrato sao conhecidos.
- Model com chamadas para SDK, fila, HTTP, PDF, WhatsApp ou Google Calendar.
- Listener que acessa tabela de outro modulo em vez de chamar Service local ou usar payload do evento.
- Provider sem bind para interface usada por Controller/Service.

## Ao Implementar Ou Refatorar

1. Identificar o caso de uso em uma frase no passado/presente: criar paciente, cancelar consulta, pagar fatura.
2. Definir a camada dona da decisao: Service/UseCase por padrao.
3. Criar DTO se o payload for nao trivial.
4. Fazer Controller apenas montar DTO e chamar Service.
5. Fazer Service depender de interfaces do proprio modulo ou contratos publicos definidos pela arquitetura.
6. Fazer Repository esconder Eloquent/SQL.
7. Colocar regra pequena de estado no Model/Entity.
8. Disparar evento para consequencias fora do caso de uso principal.
9. Registrar bind no ServiceProvider.
10. Testar Service com mock da interface e Feature test do endpoint.

## References

| Tema | Referencia | Carregar quando |
|------|------------|-----------------|
| Checklist e exemplos SOLID Laravel | [`references/solid-laravel.md`](references/solid-laravel.md) | Revisar/refatorar classe, avaliar onde colocar regra, ou corrigir controller/service/repository gordo |
| Fronteiras entre modulos | [`../architecture-paradigm-modular-monolith/SKILL.md`](../architecture-paradigm-modular-monolith/SKILL.md) | Qualquer dependencia entre `modules/*` |
| DTO, Enum, Value Object | [`../php-modern/SKILL.md`](../php-modern/SKILL.md) | Criar tipos PHP modernos |
| Estrutura CRUD do modulo | [`../backend-module/SKILL.md`](../backend-module/SKILL.md) | Criar recurso CRUD completo |
