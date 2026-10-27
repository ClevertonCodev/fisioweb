/**
 * PROTÓTIPO (descartável): aba Configurações, que junta o que na v1 está
 * espalhado (aba, /financas/categorias e /financas/lixeira): categorias de
 * entrada e de saída (do sistema e da clínica, ligar/desligar, criar,
 * excluir), saldo inicial do mês, lixeira com restaurar e repasses (plano
 * avançado). Dados reais; mudar qualquer coisa é stub.
 */
import { Lock, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useFinanceTrash } from '@/application/clinic/use-finance-transactions';
import { DsBadge, DsButton, dsCn, DsInput, DsSwitch } from '@/components/ds';
import type {
    FinancialCategory,
    FinancialTransactionType,
} from '@/domain/clinic/finance';

import { money, parseDay, periodLabel, useCategories } from './data';
import { Amount, CategoryIcon } from './parts';

export type SettingsSection = 'categorias' | 'saldo' | 'lixeira' | 'repasses';

function CategoryColumn({
    type,
    list,
}: {
    type: FinancialTransactionType;
    list: FinancialCategory[];
}) {
    const [name, setName] = useState('');
    const sorted = [...list].sort(
        (a, b) =>
            Number(b.origin === 'custom') - Number(a.origin === 'custom') ||
            a.displayOrder - b.displayOrder,
    );
    return (
        <div className="flex min-w-0 flex-col rounded-ds-xl border border-ds-border-subtle">
            <header className="flex items-center justify-between border-b border-ds-border-subtle px-4 py-3">
                <h4 className="text-ds-body-sm font-semibold">
                    {type === 'entrada' ? 'Entradas' : 'Saídas'}
                </h4>
                <span className="text-ds-caption text-ds-content-muted">
                    {list.filter((c) => c.active).length} de {list.length}{' '}
                    ligadas
                </span>
            </header>
            <ul className="max-h-96 divide-y divide-ds-border-subtle overflow-y-auto">
                {sorted.map((c) => (
                    <li
                        key={c.id}
                        className={dsCn(
                            'flex items-center gap-3 px-4 py-2',
                            !c.active && 'opacity-60',
                        )}
                    >
                        <CategoryIcon t={{ type, category: c }} size={28} />
                        <span className="min-w-0 flex-1 truncate text-ds-body-xs">
                            {c.name}
                        </span>
                        {c.origin === 'custom' ? (
                            <DsBadge variant="primary">Da clínica</DsBadge>
                        ) : (
                            <DsBadge>Do sistema</DsBadge>
                        )}
                        <DsSwitch
                            aria-label={`${c.active ? 'Desligar' : 'Ligar'} ${c.name}`}
                            checked={c.active}
                            onCheckedChange={() =>
                                toast.info(
                                    `Protótipo: "${c.name}" não foi ${c.active ? 'desligada' : 'ligada'}.`,
                                )
                            }
                        />
                        {c.origin === 'custom' ? (
                            <DsButton
                                size="sm"
                                variant="destructive-tertiary"
                                iconPosition="only"
                                icon={<Trash2 />}
                                label={`Excluir ${c.name}`}
                                onClick={() =>
                                    toast.info(
                                        `Protótipo: "${c.name}" não foi excluída.`,
                                    )
                                }
                            />
                        ) : (
                            <span className="w-8" />
                        )}
                    </li>
                ))}
            </ul>
            <form
                className="flex items-center gap-2 border-t border-ds-border-subtle p-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    toast.success(
                        `Protótipo: "${name.trim()}" não foi criada.`,
                    );
                    setName('');
                }}
            >
                <div className="flex-1">
                    <DsInput
                        size="sm"
                        aria-label={`Nova categoria de ${type === 'entrada' ? 'entrada' : 'saída'}`}
                        placeholder={
                            type === 'entrada'
                                ? 'Ex.: Pilates em grupo'
                                : 'Ex.: Lavanderia'
                        }
                        value={name}
                        onValueChange={setName}
                    />
                </div>
                <DsButton
                    size="sm"
                    type="submit"
                    variant="secondary"
                    iconPosition="left"
                    icon={<Plus />}
                    label="Criar"
                    disabled={!name.trim()}
                />
            </form>
        </div>
    );
}

export function SettingsTab({
    period,
    hidden,
    openingBalance,
    onEditOpening,
    focus,
}: {
    period: string;
    hidden: boolean;
    openingBalance: number | undefined;
    onEditOpening: () => void;
    /** Rola até a seção (vindo de /financas/categorias ou /lixeira). */
    focus?: SettingsSection;
}) {
    const { data: categories = [] } = useCategories();
    const trash = useFinanceTrash({ perPage: 50 });
    const deleted = trash.data?.data ?? [];
    useEffect(() => {
        if (focus) {
            document
                .getElementById(`fin-${focus}`)
                ?.scrollIntoView({ block: 'start' });
        }
        // Só na abertura.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const card =
        'scroll-mt-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs';

    return (
        <div className="flex flex-col gap-4">
            <section id="fin-categorias" className={card}>
                <h3 className="text-ds-body-emphasis">Categorias</h3>
                <p className="mb-4 text-ds-caption text-ds-content-muted">
                    As do sistema dá para desligar; as da clínica, criar e
                    excluir. Desligada, some do lançamento, mas os lançamentos
                    antigos continuam com ela.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                    <CategoryColumn
                        type="entrada"
                        list={categories.filter((c) => c.type === 'entrada')}
                    />
                    <CategoryColumn
                        type="saida"
                        list={categories.filter((c) => c.type === 'saida')}
                    />
                </div>
            </section>

            <section id="fin-saldo" className={card}>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="mr-auto">
                        <h3 className="text-ds-body-emphasis">Saldo inicial</h3>
                        <p className="text-ds-caption text-ds-content-muted">
                            O que havia em caixa no dia 1 de{' '}
                            {periodLabel(period).toLowerCase()}.
                        </p>
                    </div>
                    <span className="font-ds-mono text-ds-h4 font-semibold">
                        {openingBalance === undefined
                            ? '…'
                            : money(openingBalance, hidden)}
                    </span>
                    <DsButton
                        variant="secondary"
                        label="Alterar"
                        onClick={onEditOpening}
                    />
                </div>
            </section>

            <section id="fin-lixeira" className={card}>
                <h3 className="text-ds-body-emphasis">
                    Lixeira ({deleted.length})
                </h3>
                <p className="mb-4 text-ds-caption text-ds-content-muted">
                    Lançamentos excluídos. Restaurar devolve ao mês de origem.
                </p>
                {deleted.length === 0 ? (
                    <p className="py-6 text-center text-ds-body-xs text-ds-content-muted">
                        A lixeira está vazia.
                    </p>
                ) : (
                    <ul className="divide-y divide-ds-border-subtle rounded-ds-lg border border-ds-border-subtle">
                        {deleted.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-wrap items-center gap-3 px-4 py-2.5"
                            >
                                <CategoryIcon t={t} size={28} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-ds-body-xs font-medium">
                                        {t.description}
                                    </span>
                                    <span className="block text-ds-caption text-ds-content-muted">
                                        {parseDay(t.date).toLocaleDateString(
                                            'pt-BR',
                                        )}{' '}
                                        · excluído
                                        {t.deletedAt &&
                                            ` em ${new Date(t.deletedAt).toLocaleDateString('pt-BR')}`}
                                        {t.deletedBy &&
                                            ` por ${t.deletedBy.name}`}
                                    </span>
                                </span>
                                <Amount
                                    t={t}
                                    hidden={hidden}
                                    className="text-ds-caption"
                                />
                                <DsButton
                                    size="sm"
                                    variant="secondary"
                                    iconPosition="left"
                                    icon={<RotateCcw />}
                                    label="Restaurar"
                                    onClick={() =>
                                        toast.info(
                                            `Protótipo: "${t.description}" não foi restaurado.`,
                                        )
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section
                id="fin-repasses"
                className={dsCn(card, 'bg-ds-surface-subtle')}
            >
                <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-default text-ds-content-muted">
                        <Lock className="size-5" />
                    </span>
                    <div className="flex-1">
                        <h3 className="text-ds-body-emphasis">
                            Repasses aos profissionais
                        </h3>
                        <p className="text-ds-body-xs text-ds-content-secondary">
                            Calcular quanto cada fisioterapeuta recebe pelos
                            atendimentos. Disponível no plano avançado.
                        </p>
                    </div>
                    <DsButton
                        variant="secondary"
                        label="Quero conhecer"
                        onClick={() =>
                            toast.info('Protótipo: pedido não foi enviado.')
                        }
                    />
                </div>
            </section>
        </div>
    );
}
