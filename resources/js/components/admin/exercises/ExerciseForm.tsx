import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminExerciseVideoPreview } from '@/components/admin/exercises/AdminExerciseVideoPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputError } from '@/components/ui/input-error';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    SelectOptions,
    type SelectOption,
} from '@/components/ui/select-options';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface VideoOption {
    id: number;
    original_filename: string;
    thumbnail_url?: string | null;
    cdn_url?: string | null;
}

export interface ExerciseFormState {
    name: string;
    physio_area_id: string;
    physio_subarea_id: string;
    body_region_id: string;
    therapeutic_goal: string;
    description: string;
    audio_description: string;
    difficulty_level: string;
    muscle_group: string;
    movement_type: string;
    movement_form: string;
    kinetic_chain: string;
    decubitus: string;
    indications: string;
    contraindications: string;
    frequency: string;
    sets: string;
    repetitions: string;
    rest_time: string;
    clinical_notes: string;
    video_id: string;
    is_active: boolean;
}

interface ExerciseFormProps {
    form: ExerciseFormState;
    setField: (field: keyof ExerciseFormState, value: string | boolean) => void;
    errors: Record<string, string>;
    options:
        | {
              physio_areas: {
                  id: number;
                  name: string;
                  subareas?: { id: number; name: string }[];
              }[];
              body_regions: {
                  id: number;
                  name: string;
                  children?: { id: number; name: string }[];
              }[];
              difficulties: Record<string, string>;
              movement_forms: Record<string, string>;
              videos?: unknown[];
          }
        | undefined;
    submitLabel: string;
    isPending: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export function ExerciseForm({
    form,
    setField,
    errors,
    options,
    submitLabel,
    isPending,
    onSubmit,
}: ExerciseFormProps) {
    const navigate = useNavigate();
    const videos = useMemo(
        () => (options?.videos ?? []) as VideoOption[],
        [options?.videos],
    );
    const videoOptions = useMemo<SelectOption[]>(
        () =>
            videos.map((v) => ({
                value: String(v.id),
                label: v.original_filename,
                img: v.thumbnail_url ?? undefined,
            })),
        [videos],
    );
    const selectedVideo = useMemo(
        () => videoOptions.find((o) => o.value === form.video_id) ?? null,
        [videoOptions, form.video_id],
    );
    const selectedVideoData = useMemo(
        () =>
            form.video_id
                ? videos.find((v) => String(v.id) === form.video_id)
                : null,
        [videos, form.video_id],
    );
    const subareas = form.physio_area_id
        ? (options?.physio_areas?.find(
              (a) => String(a.id) === form.physio_area_id,
          )?.subareas ?? [])
        : [];

    return (
        <form onSubmit={onSubmit}>
            <Card className="max-w-3xl">
                <CardContent className="space-y-8 p-6">
                    {/* Informações Básicas */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Informações Básicas
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>
                                    Nome{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setField('name', e.target.value)
                                    }
                                    required
                                    placeholder="Nome do exercício"
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>
                                    Dificuldade{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.difficulty_level}
                                    onValueChange={(v) =>
                                        setField('difficulty_level', v)
                                    }
                                >
                                    <SelectTrigger
                                        className={
                                            errors.difficulty_level
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options?.difficulties &&
                                            Object.entries(
                                                options.difficulties,
                                            ).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>
                                                    {v}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.difficulty_level} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Objetivo Terapêutico</Label>
                                <Input
                                    value={form.therapeutic_goal}
                                    onChange={(e) =>
                                        setField(
                                            'therapeutic_goal',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ex: Fortalecimento, Mobilidade, Alongamento..."
                                />
                                <InputError message={errors.therapeutic_goal} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Descrição Passo a Passo</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setField('description', e.target.value)
                                    }
                                    placeholder="Descreva como realizar o exercício..."
                                    rows={4}
                                />
                                <InputError message={errors.description} />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Descrição em Áudio</Label>
                                <Textarea
                                    value={form.audio_description}
                                    onChange={(e) =>
                                        setField(
                                            'audio_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Opcional"
                                    rows={2}
                                />
                                <InputError
                                    message={errors.audio_description}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vídeo */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Vídeo</h2>
                        <div className="space-y-2">
                            <Label>Vídeo do Exercício</Label>
                            <SelectOptions
                                value={selectedVideo}
                                onChange={(opt) =>
                                    setField('video_id', opt?.value ?? '')
                                }
                                options={videoOptions}
                                placeholder="Selecione um vídeo..."
                                searchable
                            />
                            <InputError message={errors.video_id} />
                            <p className="text-xs text-muted-foreground">
                                Selecione um vídeo já cadastrado para associar a
                                este exercício.
                            </p>
                        </div>
                        {selectedVideoData?.cdn_url && (
                            <AdminExerciseVideoPreview
                                src={selectedVideoData.cdn_url}
                                poster={selectedVideoData.thumbnail_url}
                                title={selectedVideoData.original_filename}
                            />
                        )}
                    </div>

                    {/* Classificação */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Classificação</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label>
                                    Área da Fisioterapia{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.physio_area_id}
                                    onValueChange={(v) => {
                                        setField('physio_area_id', v);
                                        setField('physio_subarea_id', '');
                                    }}
                                    required
                                >
                                    <SelectTrigger
                                        className={
                                            errors.physio_area_id
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(options?.physio_areas ?? []).map(
                                            (a) => (
                                                <SelectItem
                                                    key={a.id}
                                                    value={String(a.id)}
                                                >
                                                    {a.name}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.physio_area_id} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Subárea</Label>
                                <Select
                                    value={form.physio_subarea_id}
                                    onValueChange={(v) =>
                                        setField('physio_subarea_id', v)
                                    }
                                    disabled={subareas.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                subareas.length === 0
                                                    ? 'Selecione uma área primeiro'
                                                    : 'Selecione...'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subareas.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>
                                    Região do Corpo{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.body_region_id}
                                    onValueChange={(v) =>
                                        setField('body_region_id', v)
                                    }
                                    required
                                >
                                    <SelectTrigger
                                        className={
                                            errors.body_region_id
                                                ? 'border-destructive'
                                                : ''
                                        }
                                    >
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(options?.body_regions ?? []).flatMap(
                                            (r) => [
                                                <SelectItem
                                                    key={r.id}
                                                    value={String(r.id)}
                                                >
                                                    {r.name}
                                                </SelectItem>,
                                                ...(r.children ?? []).map(
                                                    (c) => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={String(c.id)}
                                                        >
                                                            — {c.name}
                                                        </SelectItem>
                                                    ),
                                                ),
                                            ],
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.body_region_id} />
                            </div>
                        </div>
                    </div>

                    {/* Detalhes do Movimento */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Detalhes do Movimento
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1.5">
                                <Label>Grupo Muscular</Label>
                                <Input
                                    value={form.muscle_group}
                                    onChange={(e) =>
                                        setField('muscle_group', e.target.value)
                                    }
                                    placeholder="Ex: Quadríceps"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Tipo de Movimento</Label>
                                <Input
                                    value={form.movement_type}
                                    onChange={(e) =>
                                        setField(
                                            'movement_type',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ex: Flexão, Extensão"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Forma de Movimento</Label>
                                <Select
                                    value={form.movement_form}
                                    onValueChange={(v) =>
                                        setField('movement_form', v)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options?.movement_forms &&
                                            Object.entries(
                                                options.movement_forms,
                                            ).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>
                                                    {v}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Cadeia Cinética</Label>
                                <Input
                                    value={form.kinetic_chain}
                                    onChange={(e) =>
                                        setField(
                                            'kinetic_chain',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ex: Aberta, Fechada"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Decúbito</Label>
                            <Input
                                value={form.decubitus}
                                onChange={(e) =>
                                    setField('decubitus', e.target.value)
                                }
                                placeholder="Ex: Dorsal, Ventral, Lateral, Sentado, Em pé"
                            />
                        </div>
                    </div>

                    {/* Prescrição Padrão */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Prescrição Padrão
                        </h2>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-1.5">
                                <Label>Frequência</Label>
                                <Input
                                    value={form.frequency}
                                    onChange={(e) =>
                                        setField('frequency', e.target.value)
                                    }
                                    placeholder="Ex: 3x por semana"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Séries</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={form.sets}
                                    onChange={(e) =>
                                        setField('sets', e.target.value)
                                    }
                                    placeholder="Ex: 3"
                                />
                                <InputError message={errors.sets} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Repetições</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={form.repetitions}
                                    onChange={(e) =>
                                        setField('repetitions', e.target.value)
                                    }
                                    placeholder="Ex: 12"
                                />
                                <InputError message={errors.repetitions} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descanso (seg)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={600}
                                    value={form.rest_time}
                                    onChange={(e) =>
                                        setField('rest_time', e.target.value)
                                    }
                                    placeholder="Ex: 60"
                                />
                                <InputError message={errors.rest_time} />
                            </div>
                        </div>
                    </div>

                    {/* Indicações Clínicas */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">
                            Indicações Clínicas
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Indicações</Label>
                                <Textarea
                                    value={form.indications}
                                    onChange={(e) =>
                                        setField('indications', e.target.value)
                                    }
                                    placeholder="Para quais condições este exercício é indicado..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Contraindicações</Label>
                                <Textarea
                                    value={form.contraindications}
                                    onChange={(e) =>
                                        setField(
                                            'contraindications',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Em quais situações este exercício NÃO deve ser realizado..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Observações Clínicas</Label>
                            <Textarea
                                value={form.clinical_notes}
                                onChange={(e) =>
                                    setField('clinical_notes', e.target.value)
                                }
                                placeholder="Observações adicionais para o fisioterapeuta..."
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Ativo */}
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={form.is_active}
                            onCheckedChange={(v) => setField('is_active', v)}
                        />
                        <Label>Ativo</Label>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-border pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {submitLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
