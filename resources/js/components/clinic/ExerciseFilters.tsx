import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FilterCategory, ExerciseFilters as Filters } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface ExerciseFiltersProps {
    categories: FilterCategory[];
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onClose?: () => void;
}

export function ExerciseFilters({
    categories,
    filters,
    onFiltersChange,
    onClose,
}: ExerciseFiltersProps) {
    const [filterSearch, setFilterSearch] = useState('');
    const [openCategories, setOpenCategories] = useState<string[]>([]);

    const toggleCategory = (categoryId: string) => {
        setOpenCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        );
    };

    const toggleFilter = (categoryId: string, value: string) => {
        const currentValues = (filters[categoryId as keyof Filters] as string[]) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];

        onFiltersChange({
            ...filters,
            [categoryId]: newValues,
        });
    };

    const clearAllFilters = () => {
        onFiltersChange({
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
        });
    };

    const getActiveFiltersCount = () => {
        return Object.entries(filters)
            .filter(([key]) => key !== 'search')
            .reduce((count, [, value]) => count + (Array.isArray(value) ? value.length : 0), 0);
    };

    const filteredCategories = categories
        .map((category) => ({
            ...category,
            options: category.options.filter((option) =>
                option.label.toLowerCase().includes(filterSearch.toLowerCase()),
            ),
        }))
        .filter((category) => category.options.length > 0);

    const activeCount = getActiveFiltersCount();

    return (
        <div className="bg-card border-border flex h-full flex-col border-l">
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b p-4">
                <h2 className="text-card-foreground text-lg font-semibold">Filtros</h2>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Search */}
            <div className="border-border border-b p-4">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        placeholder="Pesquisar filtro"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Filter Categories */}
            <ScrollArea className="flex-1">
                <div className="space-y-2 p-4">
                    {filteredCategories.map((category) => {
                        const isOpen = openCategories.includes(category.id);
                        const selectedCount = (
                            (filters[category.id as keyof Filters] as string[]) || []
                        ).length;

                        return (
                            <Collapsible
                                key={category.id}
                                open={isOpen}
                                onOpenChange={() => toggleCategory(category.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    <button className="text-card-foreground hover:text-primary flex w-full items-center justify-between px-1 py-2.5 text-sm font-medium transition-colors">
                                        <span className="flex items-center gap-2">
                                            {category.label}
                                            {selectedCount > 0 && (
                                                <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </span>
                                        {isOpen ? (
                                            <ChevronUp className="text-muted-foreground h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="text-muted-foreground h-4 w-4" />
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
                                            const isChecked = selectedValues.includes(option.value);

                                            return (
                                                <label
                                                    key={option.value}
                                                    className="group flex cursor-pointer items-center gap-3 py-1"
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() =>
                                                            toggleFilter(category.id, option.value)
                                                        }
                                                    />
                                                    <span
                                                        className={cn(
                                                            'text-sm transition-colors',
                                                            isChecked
                                                                ? 'text-card-foreground font-medium'
                                                                : 'text-muted-foreground group-hover:text-card-foreground',
                                                        )}
                                                    >
                                                        {option.label}
                                                    </span>
                                                    {option.count !== undefined && (
                                                        <span className="text-muted-foreground ml-auto text-xs">
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

            {/* Footer */}
            <div className="border-border flex items-center justify-between gap-3 border-t p-4">
                <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    disabled={activeCount === 0}
                    className="text-muted-foreground"
                >
                    Limpar filtros
                </Button>
            </div>
        </div>
    );
}
