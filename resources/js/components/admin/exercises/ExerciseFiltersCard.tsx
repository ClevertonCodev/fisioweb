import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ExerciseFiltersCardProps {
    search: string;
    onSearchChange: (v: string) => void;
    physioAreaId: string;
    onPhysioAreaChange: (v: string) => void;
    bodyRegionId: string;
    onBodyRegionChange: (v: string) => void;
    difficultyLevel: string;
    onDifficultyChange: (v: string) => void;
    movementForm: string;
    onMovementFormChange: (v: string) => void;
    onSearch: () => void;
    onClear: () => void;
    options:
        | {
              physio_areas: { id: number; name: string }[];
              body_regions: {
                  id: number;
                  name: string;
                  children?: { id: number; name: string }[];
              }[];
              difficulties: Record<string, string>;
              movement_forms: Record<string, string>;
          }
        | undefined;
}

export function ExerciseFiltersCard({
    search,
    onSearchChange,
    physioAreaId,
    onPhysioAreaChange,
    bodyRegionId,
    onBodyRegionChange,
    difficultyLevel,
    onDifficultyChange,
    movementForm,
    onMovementFormChange,
    onSearch,
    onClear,
    options,
}: ExerciseFiltersCardProps) {
    return (
        <Card>
            <CardContent className="space-y-4 p-4">
                <h3 className="text-foreground font-medium">Filtros</h3>
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-sm">Buscar</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                placeholder="Nome do exercício"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-sm">Área</Label>
                        <Select value={physioAreaId || 'todos'} onValueChange={onPhysioAreaChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas</SelectItem>
                                {(options?.physio_areas ?? []).map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-sm">Região corporal</Label>
                        <Select value={bodyRegionId || 'todos'} onValueChange={onBodyRegionChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas</SelectItem>
                                {(options?.body_regions ?? []).flatMap((r) => [
                                    <SelectItem key={r.id} value={String(r.id)}>
                                        {r.name}
                                    </SelectItem>,
                                    ...(r.children ?? []).map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            — {c.name}
                                        </SelectItem>
                                    )),
                                ])}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-sm">Dificuldade</Label>
                        <Select
                            value={difficultyLevel || 'todos'}
                            onValueChange={onDifficultyChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas</SelectItem>
                                {options?.difficulties &&
                                    Object.entries(options.difficulties).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>
                                            {v}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-sm">Forma de movimento</Label>
                        <Select
                            value={movementForm || 'todos'}
                            onValueChange={onMovementFormChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todas</SelectItem>
                                {options?.movement_forms &&
                                    Object.entries(options.movement_forms).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>
                                            {v}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onSearch}>Buscar</Button>
                        <Button variant="outline" onClick={onClear}>
                            Limpar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
