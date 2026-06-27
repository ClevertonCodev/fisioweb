# Event-Driven Architecture Inside the Monolith

## Event Types

Use **domain events** para fatos importantes dentro do modulo dono: `PatientCreated`, `TreatmentPlanCompleted`, `InvoicePaid`.

Use **integration events** para fatos estaveis consumidos por outros modulos. Eles devem mudar raramente e carregar payload explicito.

Use Laravel events/listeners para comunicacao in-process. Use queued listeners/jobs quando houver I/O, PDF, WhatsApp, storage, email ou tarefas lentas.

## Event Naming

- Nomear no passado: `ClinicCreated`, `PatientArchived`, `MediaUploadCompleted`.
- Nao nomear como comando: prefira `InvoicePaid` a `SendReceipt`.
- Colocar o evento no modulo dono do fato.

## Payload Rules

- Carregar IDs, tenant/clinic id e snapshot minimo necessario.
- Nao carregar Model Eloquent completo como contrato entre modulos.
- Incluir `occurredAt` quando ordem/auditoria importar.
- Incluir versao quando o evento for duradouro ou usado por muitos consumidores.

Example:

```php
final readonly class PatientCreated
{
    public function __construct(
        public int $patientId,
        public int $clinicId,
        public string $name,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

## Consistency Rules

- Use chamada sincrona quando o usuario precisa resposta imediata e consistente.
- Use evento quando o efeito pode ser eventual.
- Dispare eventos depois da transacao confirmar quando o listener depende dos dados persistidos.
- Para jobs/listeners com efeito externo, garantir idempotencia por chave natural ou tabela de controle.
- Nao esconder regra critica apenas em listener assincromo; regra critica pertence ao Service do modulo dono.

## Listener Placement

- O evento mora no modulo que possui o fato.
- O listener mora no modulo que possui a consequencia.
- O listener chama Service/Repository do seu proprio modulo.
- Se precisar consultar o modulo emissor, usar contrato publico ou payload suficiente.

## Testing

- Testar que o Service do modulo dono despacha o evento correto.
- Testar listener isolado com evento fake/DTO.
- Usar `Queue::fake()` para listeners/jobs assincromos quando aplicavel.
- Cobrir idempotencia quando o listener puder rodar mais de uma vez.
