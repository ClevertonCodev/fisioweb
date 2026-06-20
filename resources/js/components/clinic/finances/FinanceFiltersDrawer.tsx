import { Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useFinanceCategories } from '@/application/clinic/use-finance-categories';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    DEFAULT_FINANCE_FILTERS,
    FILTER_PRESET_LABELS,
    PAYMENT_METHOD_LABELS,
    type FinanceFilterPreset,
    type FinanceFilters,
    type PaymentMethod,
} from '@/domain/clinic/finance';

interface FinanceFiltersDrawerProps {
    filters: FinanceFilters;
    onApply: (filters: FinanceFilters) => void;
}

export function FinanceFiltersDrawer({
    filters,
    onApply,
}: FinanceFiltersDrawerProps) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<FinanceFilters>(filters);
    const { data: categories = [] } = useFinanceCategories();

    useEffect(() => {
        if (open) setDraft(filters);
    }, [open, filters]);

    const apply = () => {
        onApply(draft);
        setOpen(false);
    };

    const clear = () => {
        setDraft(DEFAULT_FINANCE_FILTERS);
        onApply(DEFAULT_FINANCE_FILTERS);
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 px-4 py-2">
                    <div className="grid gap-2">
                        <Label>Transações</Label>
                        <Select
                            value={draft.filterPreset}
                            onValueChange={(v) =>
                                setDraft((d) => ({
                                    ...d,
                                    filterPreset: v as FinanceFilterPreset,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    Object.entries(FILTER_PRESET_LABELS) as [
                                        FinanceFilterPreset,
                                        string,
                                    ][]
                                ).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Categoria</Label>
                        <Select
                            value={draft.categoryId ?? 'all'}
                            onValueChange={(v) =>
                                setDraft((d) => ({
                                    ...d,
                                    categoryId: v === 'all' ? undefined : v,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Método de pagamento</Label>
                        <Select
                            value={draft.paymentMethod ?? 'all'}
                            onValueChange={(v) =>
                                setDraft((d) => ({
                                    ...d,
                                    paymentMethod:
                                        v === 'all'
                                            ? undefined
                                            : (v as PaymentMethod),
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {(
                                    Object.entries(PAYMENT_METHOD_LABELS) as [
                                        PaymentMethod,
                                        string,
                                    ][]
                                ).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <SheetFooter className="flex-row gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={clear}
                    >
                        Limpar filtros
                    </Button>
                    <Button className="cursor-pointer" onClick={apply}>
                        Aplicar filtros
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
