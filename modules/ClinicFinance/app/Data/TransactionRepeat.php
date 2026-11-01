<?php

namespace Modules\ClinicFinance\Data;

use Carbon\CarbonImmutable;
use Modules\ClinicFinance\Enums\FinancialSeriesKind;
use Modules\ClinicFinance\Enums\RecurrenceFrequency;

/**
 * O "Repetir" do lançamento novo: não repete (`kind` nulo), parcelado em
 * `installments` vezes ou recorrente (`frequency`, até `endsOn`; nulo = sem fim).
 */
final readonly class TransactionRepeat
{
    public function __construct(
        public ?FinancialSeriesKind $kind = null,
        public ?int $installments = null,
        public ?RecurrenceFrequency $frequency = null,
        public ?CarbonImmutable $endsOn = null,
    ) {}

    public static function none(): self
    {
        return new self;
    }

    /**
     * @param  array{kind?: string, total?: int|string, frequency?: string, ends_on?: string|null}|null  $repeat  o `repeat` já validado
     */
    public static function fromArray(?array $repeat): self
    {
        $kind = FinancialSeriesKind::tryFrom((string) ($repeat['kind'] ?? ''));

        return match ($kind) {
            FinancialSeriesKind::Installments => new self($kind, (int) $repeat['total']),
            FinancialSeriesKind::Recurrence   => new self(
                kind: $kind,
                frequency: RecurrenceFrequency::from((string) $repeat['frequency']),
                endsOn: empty($repeat['ends_on']) ? null : CarbonImmutable::parse($repeat['ends_on'])->startOfDay(),
            ),
            default => self::none(),
        };
    }

    public function repeats(): bool
    {
        return !is_null($this->kind);
    }
}
