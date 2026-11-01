/**
 * Editar ou excluir um lançamento de série pergunta o alcance: "Só esta" ou
 * "Esta e as próximas" (parcelas). Nas parcelas, "as próximas" são só as
 * pendentes; as já pagas ou recebidas ficam como estão.
 */
import { DsButton, DsModal } from '@/components/ds';
import type { SeriesScope, TransactionSeries } from '@/domain/clinic/finance';

/** Os rótulos do alcance pela espécie da série. */
export function seriesScopeLabels(series: TransactionSeries) {
    const position = series.total
        ? `${series.index}/${series.total}`
        : `${series.index}`;
    return series.kind === 'installments'
        ? {
              position: `parcela ${position}`,
              only: 'Só esta',
              following: 'Esta e as próximas',
          }
        : {
              position: `ocorrência ${position}`,
              only: 'Só este',
              following: 'Este e os próximos',
          };
}

/**
 * O que cada escolha faz. Na recorrência, "Este e os próximos" divide a série
 * (editar) ou encerra a repetição (excluir), como no Google Agenda (ADR 026).
 */
function scopeExplanation(
    series: TransactionSeries,
    destructive: boolean,
    labels: ReturnType<typeof seriesScopeLabels>,
): string {
    const { only, following } = labels;
    if (series.kind === 'recurrence') {
        return destructive
            ? `“${only}” manda só este lançamento para a lixeira. “${following}” encerra a repetição aqui: este e os próximos pendentes vão para a lixeira e nada novo é criado; os anteriores e os já pagos ou recebidos ficam. Dá para restaurar em Configurações, na Lixeira.`
            : `“${only}” muda só este lançamento. Com “${following}”, a regra muda daqui para frente: este e os próximos pendentes passam a ter os dados novos; os anteriores e os já pagos ou recebidos ficam como estão.`;
    }
    return destructive
        ? `“${only}” manda só este lançamento para a lixeira. “${following}” leva também as próximas pendentes; as já pagas ou recebidas ficam. Dá para restaurar em Configurações, na Lixeira.`
        : `“${only}” muda só este lançamento. “${following}” leva o que você mudou às próximas pendentes; as datas, a situação e as já pagas ou recebidas ficam como estão.`;
}

export function SeriesScopeDialog({
    series,
    action,
    open,
    pending,
    onChoose,
    onCancel,
}: {
    series: TransactionSeries;
    action: 'update' | 'delete';
    open: boolean;
    pending: boolean;
    onChoose: (scope: SeriesScope) => void;
    onCancel: () => void;
}) {
    const labels = seriesScopeLabels(series);
    const destructive = action === 'delete';
    return (
        <DsModal
            open={open}
            onOpenChange={(o) => {
                if (!o && !pending) onCancel();
            }}
            size="sm"
            title={
                destructive
                    ? `Excluir a ${labels.position}?`
                    : `Alterar a ${labels.position}`
            }
            footer={
                <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={pending}
                        onClick={onCancel}
                    />
                    <DsButton
                        variant={
                            destructive ? 'destructive-secondary' : 'secondary'
                        }
                        label={labels.only}
                        disabled={pending}
                        onClick={() => onChoose('only')}
                    />
                    <DsButton
                        variant={destructive ? 'destructive' : 'primary'}
                        label={labels.following}
                        disabled={pending}
                        onClick={() => onChoose('following')}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                {scopeExplanation(series, destructive, labels)}
            </p>
        </DsModal>
    );
}
