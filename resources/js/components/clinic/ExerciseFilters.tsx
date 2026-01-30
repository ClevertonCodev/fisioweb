import * as React from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
    ExerciseFilters as Filters,
    FilterCategory,
} from '@/types/exercise';

interface ExerciseFiltersProps {
    categories: FilterCategory[];
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onClose?: () => void;
}

const initialFilters: Filters = {
    search: '',
    specialty: [],
    bodyArea: [],
    bodyRegion: [],
    objective: [],
    difficulty: [],
    muscleGroup: [],
    equipment: [],
    movementType: [],
    movementPattern: [],
    movementForm: [],
};

export function ExerciseFilters({
    categories,
    filters,
    onFiltersChange,
    onClose,
}: ExerciseFiltersProps) {
    const [filterSearch, setFilterSearch] = React.useState('');
    const [openCategories, setOpenCategories] = React.useState<string[]>([]);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        );
    };

    const toggleFilter = (categoryId: string, value: string) => {
        const currentValues =
            (filters[categoryId as keyof Filters] as string[]) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];
        onFiltersChange({ ...filters, [categoryId]: newValues });
    };

    const clearAllFilters = () => {
        onFiltersChange(initialFilters);
    };

    const filteredCategories = categories
        .map((category) => ({
            ...category,
            options: category.options.filter((option) =>
                option.label
                    .toLowerCase()
                    .includes(filterSearch.toLowerCase()),
            ),
        }))
        .filter((category) => category.options.length > 0);

    return (
        <div className="flex h-full min-h-0 flex-col border-l border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="text-lg font-semibold text-card-foreground">
                    Filtros
                </h2>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="border-b border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar filtro"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 p-4">
                    {filteredCategories.map((category) => {
                        const isOpen = openCategories.includes(category.id);
                        const selectedValues =
                            (filters[category.id as keyof Filters] as
                                | string[]
                                | undefined) ?? [];
                        const selectedCount = selectedValues.length;
                        return (
                            <Collapsible
                                key={category.id}
                                open={isOpen}
                                onOpenChange={() =>
                                    toggleCategory(category.id)
                                }
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between px-1 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:text-primary"
                                    >
                                        <span className="flex items-center gap-2">
                                            {category.label}
                                            {selectedCount > 0 && (
                                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </span>
                                        {isOpen ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="space-y-2 py-2 pl-1">
                                        {category.options.map((option) => {
                                            const selectedValues =
                                                (filters[
                                                    category.id as keyof Filters
                                                ] as string[]) || [];
                                            const isChecked =
                                                selectedValues.includes(
                                                    option.value,
                                                );
                                            return (
                                                <label
                                                    key={option.value}
                                                    className="group flex cursor-pointer items-center gap-3 py-1"
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() =>
                                                            toggleFilter(
                                                                category.id,
                                                                option.value,
                                                            )
                                                        }
                                                    />
                                                    <span
                                                        className={cn(
                                                            'text-sm transition-colors',
                                                            isChecked
                                                                ? 'font-medium text-card-foreground'
                                                                : 'text-muted-foreground group-hover:text-card-foreground',
                                                        )}
                                                    >
                                                        {option.label}
                                                    </span>
                                                    {option.count != null && (
                                                        <span className="ml-auto text-xs text-muted-foreground">
                                                            {option.count}
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })}
                </div>
            </ScrollArea>
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
                <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="text-muted-foreground"
                >
                    Limpar filtros
                </Button>
                <Button className="flex-1">Ver exercícios</Button>
            </div>
        </div>
    );
}
