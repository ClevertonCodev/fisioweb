import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import InputError from '@/components/input-error';
import {
    SelectOptions,
    type SelectOption,
} from '@/components/select-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { VideoPlayer } from '@/components/video-player';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BodyRegion, type PhysioArea } from '@/types';
import { type VideoData } from '@/types/video';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Exercícios', href: '/admin/exercises' },
    { title: 'Novo Exercício', href: '/admin/exercises/create' },
];

interface CreateExerciseProps {
    physioAreas: PhysioArea[];
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
    videos: VideoData[];
}

export default function Create({
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
    videos,
}: CreateExerciseProps) {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        name: '',
        physio_area_id: '',
        physio_subarea_id: '',
        body_region_id: '',
        therapeutic_goal: '',
        description: '',
        audio_description: '',
        difficulty_level: 'medium',
        muscle_group: '',
        movement_type: '',
        movement_form: '',
        kinetic_chain: '',
        decubitus: '',
        indications: '',
        contraindications: '',
        frequency: '',
        sets: '',
        repetitions: '',
        rest_time: '',
        clinical_notes: '',
        video_id: '',
    });

    const videoOptions = useMemo<SelectOption[]>(
        () =>
            videos.map((v) => ({
                value: String(v.id),
                label: v.original_filename,
                img: v.thumbnail_url ?? undefined,
            })),
        [videos],
    );

    const selectedVideo = useMemo<SelectOption | null>(
        () => videoOptions.find((o) => o.value === data.video_id) ?? null,
        [videoOptions, data.video_id],
    );

    const selectedVideoData = useMemo(
        () => (data.video_id ? videos.find((v) => String(v.id) === data.video_id) : null),
        [videos, data.video_id],
    );

    // Subáreas filtradas pela área selecionada
    const filteredSubareas = useMemo(() => {
        if (!data.physio_area_id) return [];
        const area = physioAreas.find((a) => a.id === Number(data.physio_area_id));
        return area?.subareas || [];
    }, [data.physio_area_id, physioAreas]);

    const handleCancel = useCallback(() => {
        router.visit('/admin/exercises');
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            post('/admin/exercises', {
                onSuccess: () => router.visit('/admin/exercises'),
            });
        },
        [post],
    );

    const setField = useCallback(
        (field: string, value: string) => {
            setData(field as keyof typeof data, value);
            if (errors[field as keyof typeof errors]) clearErrors(field as keyof typeof errors);
        },
        [setData, errors, clearErrors],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Novo Exercício" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleCancel} className="shrink-0">
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Novo Exercício</h1>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Informações Básicas */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Informações Básicas</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nome <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setField('name', e.target.value)}
                                        placeholder="Nome do exercício"
                                        className={errors.name ? 'border-destructive' : ''}
                                        autoFocus
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="difficulty_level">
                                        Dificuldade <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.difficulty_level}
                                        onValueChange={(v) => setField('difficulty_level', v)}
                                    >
                                        <SelectTrigger className={errors.difficulty_level ? 'border-destructive' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(difficulties).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.difficulty_level} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="therapeutic_goal">Objetivo Terapêutico</Label>
                                <Input
                                    id="therapeutic_goal"
                                    value={data.therapeutic_goal}
                                    onChange={(e) => setField('therapeutic_goal', e.target.value)}
                                    placeholder="Ex: Fortalecimento, Mobilidade, Alongamento..."
                                />
                                <InputError message={errors.therapeutic_goal} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição Passo a Passo</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setField('description', e.target.value)}
                                    placeholder="Descreva como realizar o exercício..."
                                    rows={4}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        {/* Vídeo */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Vídeo</h2>
                            <div className="space-y-2">
                                <Label>Vídeo do Exercício</Label>
                                <SelectOptions
                                    name="video_id"
                                    value={selectedVideo}
                                    onChange={(option) => {
                                        setField('video_id', option?.value ?? '');
                                    }}
                                    options={videoOptions}
                                    placeHolder="Selecione um vídeo..."
                                    searchable
                                />
                                <InputError message={errors.video_id} />
                                <p className="text-xs text-muted-foreground">
                                    Selecione um vídeo já cadastrado para associar a este exercício.
                                </p>
                            </div>

                            {selectedVideoData?.cdn_url && (
                                <div className="max-w-sm overflow-hidden rounded-lg border border-sidebar-border/70">
                                    <VideoPlayer
                                        src={selectedVideoData.cdn_url}
                                        poster={selectedVideoData.thumbnail_url}
                                        title={selectedVideoData.original_filename}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Classificação */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Classificação</h2>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>
                                        Área da Fisioterapia <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.physio_area_id}
                                        onValueChange={(v) => {
                                            setField('physio_area_id', v);
                                            setData('physio_subarea_id', '');
                                        }}
                                    >
                                        <SelectTrigger className={errors.physio_area_id ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {physioAreas.map((area) => (
                                                <SelectItem key={area.id} value={String(area.id)}>
                                                    {area.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.physio_area_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Subárea</Label>
                                    <Select
                                        value={data.physio_subarea_id}
                                        onValueChange={(v) => setField('physio_subarea_id', v)}
                                        disabled={filteredSubareas.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={filteredSubareas.length === 0 ? 'Selecione uma área primeiro' : 'Selecione...'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSubareas.map((sub) => (
                                                <SelectItem key={sub.id} value={String(sub.id)}>
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.physio_subarea_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Região do Corpo <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={data.body_region_id}
                                        onValueChange={(v) => setField('body_region_id', v)}
                                    >
                                        <SelectTrigger className={errors.body_region_id ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bodyRegions.map((region) => (
                                                <React.Fragment key={region.id}>
                                                    <SelectItem value={String(region.id)} className="font-semibold">
                                                        {region.name}
                                                    </SelectItem>
                                                    {region.children?.map((child) => (
                                                        <SelectItem key={child.id} value={String(child.id)}>
                                                            &nbsp;&nbsp;{child.name}
                                                        </SelectItem>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.body_region_id} />
                                </div>
                            </div>
                        </div>

                        {/* Detalhes do Movimento */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Detalhes do Movimento</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="muscle_group">Grupo Muscular</Label>
                                    <Input
                                        id="muscle_group"
                                        value={data.muscle_group}
                                        onChange={(e) => setField('muscle_group', e.target.value)}
                                        placeholder="Ex: Quadríceps"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="movement_type">Tipo de Movimento</Label>
                                    <Input
                                        id="movement_type"
                                        value={data.movement_type}
                                        onChange={(e) => setField('movement_type', e.target.value)}
                                        placeholder="Ex: Flexão, Extensão"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma de Movimento</Label>
                                    <Select value={data.movement_form} onValueChange={(v) => setField('movement_form', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(movementForms).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kinetic_chain">Cadeia Cinética</Label>
                                    <Input
                                        id="kinetic_chain"
                                        value={data.kinetic_chain}
                                        onChange={(e) => setField('kinetic_chain', e.target.value)}
                                        placeholder="Ex: Aberta, Fechada"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="decubitus">Decúbito</Label>
                                <Input
                                    id="decubitus"
                                    value={data.decubitus}
                                    onChange={(e) => setField('decubitus', e.target.value)}
                                    placeholder="Ex: Dorsal, Ventral, Lateral, Sentado, Em pé"
                                />
                            </div>
                        </div>

                        {/* Prescrição Padrão */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Prescrição Padrão</h2>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequência</Label>
                                    <Input
                                        id="frequency"
                                        value={data.frequency}
                                        onChange={(e) => setField('frequency', e.target.value)}
                                        placeholder="Ex: 3x por semana"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sets">Séries</Label>
                                    <Input
                                        id="sets"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={data.sets}
                                        onChange={(e) => setField('sets', e.target.value)}
                                        placeholder="Ex: 3"
                                    />
                                    <InputError message={errors.sets} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="repetitions">Repetições</Label>
                                    <Input
                                        id="repetitions"
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={data.repetitions}
                                        onChange={(e) => setField('repetitions', e.target.value)}
                                        placeholder="Ex: 12"
                                    />
                                    <InputError message={errors.repetitions} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rest_time">Descanso (seg)</Label>
                                    <Input
                                        id="rest_time"
                                        type="number"
                                        min="0"
                                        max="600"
                                        value={data.rest_time}
                                        onChange={(e) => setField('rest_time', e.target.value)}
                                        placeholder="Ex: 60"
                                    />
                                    <InputError message={errors.rest_time} />
                                </div>
                            </div>
                        </div>

                        {/* Indicações Clínicas */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">Indicações Clínicas</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="indications">Indicações</Label>
                                    <Textarea
                                        id="indications"
                                        value={data.indications}
                                        onChange={(e) => setField('indications', e.target.value)}
                                        placeholder="Para quais condições este exercício é indicado..."
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contraindications">Contraindicações</Label>
                                    <Textarea
                                        id="contraindications"
                                        value={data.contraindications}
                                        onChange={(e) => setField('contraindications', e.target.value)}
                                        placeholder="Em quais situações este exercício NÃO deve ser realizado..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clinical_notes">Observações Clínicas</Label>
                                <Textarea
                                    id="clinical_notes"
                                    value={data.clinical_notes}
                                    onChange={(e) => setField('clinical_notes', e.target.value)}
                                    placeholder="Observações adicionais para o fisioterapeuta..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex items-center justify-end gap-4 border-t border-sidebar-border/70 pt-6">
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={processing}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner className="mr-2" />}
                                Salvar Exercício
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
