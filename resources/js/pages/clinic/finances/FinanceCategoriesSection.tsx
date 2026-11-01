/**
 * Seção de categorias das Configurações de Finanças: entradas e saídas, as do
 * sistema e as da clínica, com quantas estão ligadas. O administrador cria as
 * da clínica, liga/desliga qualquer uma e exclui só as da clínica (com
 * lançamentos, a API responde 409 e a mensagem aparece no toast). A
 * secretária não vê a seção; a API também barra (403).
 */
import { Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';

import { can } from '@/application/clinic/permissions';
import {
    useCreateFinanceCategory,
    useDeleteFinanceCategory,
    useFinanceSettingsCategories,
    useToggleFinanceCategory,
} from '@/application/clinic/use-finance-categories';
import { DsBadge, DsButton, dsCn, DsInput, DsSwitch } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type {
    FinancialCategory,
    FinancialTransactionType,
} from '@/domain/clinic/finance';

import { CategoryIcon } from './finance-parts';

function CategoryRow({ category }: { category: FinancialCategory }) {
    const switchId = useId();
    const toggle = useToggleFinanceCategory();
    const remove = useDeleteFinanceCategory();
    const custom = category.origin === 'custom';

    return (
        <li
            className={dsCn(
                'flex items-center gap-3 px-4 py-2',
                !category.active && 'opacity-60',
            )}
        >
            <CategoryIcon t={{ type: category.type, category }} size={28} />
            {/* No celular o selo desce para baixo do nome, para o nome caber. */}
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="w-full min-w-0 truncate text-ds-body-xs sm:w-auto sm:flex-1">
                    {category.name}
                </span>
                {custom ? (
                    <DsBadge variant="primary">Da clínica</DsBadge>
                ) : (
                    <DsBadge>Do sistema</DsBadge>
                )}
            </span>
            <label htmlFor={switchId} className="sr-only">
                {category.active ? 'Desligar' : 'Ligar'} {category.name}
            </label>
            <DsSwitch
                id={switchId}
                checked={category.active}
                disabled={toggle.isPending}
                onCheckedChange={() => toggle.mutate(category)}
            />
            {custom ? (
                <DsButton
                    size="sm"
                    variant="destructive-tertiary"
                    iconPosition="only"
                    icon={<Trash2 />}
                    label={`Excluir ${category.name}`}
                    loading={remove.isPending}
                    onClick={() => remove.mutate(category)}
                />
            ) : (
                <span className="w-8" />
            )}
        </li>
    );
}

function CategoryColumn({
    type,
    list,
}: {
    type: FinancialTransactionType;
    list: FinancialCategory[];
}) {
    const headingId = useId();
    const [name, setName] = useState('');
    const create = useCreateFinanceCategory();
    const title = type === 'entrada' ? 'Entradas' : 'Saídas';
    const sorted = [...list].sort(
        (a, b) =>
            Number(b.origin === 'custom') - Number(a.origin === 'custom') ||
            a.displayOrder - b.displayOrder,
    );

    return (
        <section
            aria-labelledby={headingId}
            className="flex min-w-0 flex-col rounded-ds-xl border border-ds-border-subtle"
        >
            <header className="flex items-center justify-between border-b border-ds-border-subtle px-4 py-3">
                <h4 id={headingId} className="text-ds-body-sm font-semibold">
                    {title}
                </h4>
                <span className="text-ds-caption text-ds-content-muted">
                    {list.filter((c) => c.active).length} de {list.length}{' '}
                    ligadas
                </span>
            </header>
            <ul className="max-h-96 divide-y divide-ds-border-subtle overflow-y-auto">
                {sorted.map((c) => (
                    <CategoryRow key={c.id} category={c} />
                ))}
            </ul>
            <form
                className="flex items-center gap-2 border-t border-ds-border-subtle p-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = name.trim();
                    if (!trimmed) return;
                    create.mutate(
                        { name: trimmed, type },
                        { onSuccess: () => setName('') },
                    );
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
                        maxLength={120}
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
                    loading={create.isPending}
                    disabled={!name.trim()}
                />
            </form>
        </section>
    );
}

function CategoriesCard({ className }: { className?: string }) {
    const { data: categories = [], isError } = useFinanceSettingsCategories();

    return (
        <section id="fin-categorias" className={className}>
            <h3 className="text-ds-body-emphasis">Categorias</h3>
            <p className="mb-4 text-ds-caption text-ds-content-muted">
                As do sistema dá para desligar; as da clínica, criar e excluir.
                Desligada, some do lançamento, mas os lançamentos antigos
                continuam com ela.
            </p>
            {isError ? (
                <p
                    role="alert"
                    className="py-6 text-center text-ds-body-xs text-ds-content-muted"
                >
                    Não foi possível carregar as categorias.
                </p>
            ) : (
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
            )}
        </section>
    );
}

/** Só o administrador vê (e busca) as categorias para mexer. */
export function FinanceCategoriesSection({
    className,
}: {
    className?: string;
}) {
    const { user } = useAuth();
    if (!can.manageFinanceSettings(user?.role as ClinicRole | undefined)) {
        return null;
    }
    return <CategoriesCard className={className} />;
}
