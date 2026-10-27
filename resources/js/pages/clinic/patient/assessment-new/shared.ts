import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    useAssessmentTemplate,
    useAssessmentTemplates,
    useCreateAssessment,
} from '@/application/clinic/use-assessments';
import { usePatientDetail } from '@/application/clinic/use-patients';
import type { AssessmentTemplateSummary } from '@/domain/clinic';

const AREAS: [RegExp, string][] = [
    [/musculoesquel/i, 'Musculoesquelética'],
    [/p[ée]lvica/i, 'Pélvica'],
    [/neurol/i, 'Neurológica'],
    [/respirat/i, 'Respiratória'],
    [/esportiva/i, 'Esportiva'],
    [/geronto/i, 'Gerontologia'],
    [/pilates/i, 'Pilates'],
    [/postural/i, 'Postural'],
];

export function areaOf(name: string): string {
    return AREAS.find(([re]) => re.test(name))?.[1] ?? 'Geral';
}

/** "Fisioterapia Musculoesquelética: Lombar" → "Lombar". */
export function shortName(name: string): string {
    const parts = name.split(':');
    if (parts.length > 1) return parts.slice(1).join(':').trim();
    return name.split(' - ')[0]?.trim() ?? name;
}

/** Diagnóstico do paciente → trecho do nome do modelo indicado. */
const SUGGESTIONS: [RegExp, RegExp][] = [
    [/lomb|lombar|h[ée]rnia de disco|ci[áa]tic/i, /lombar/i],
    [/cervic|pesco[çc]o|torcicolo/i, /cervical/i],
    [/avc|parkinson|neuro|esclerose|paralisia/i, /neurol/i],
    [/dpoc|asma|respir|covid|pneum/i, /respirat/i],
    [/incontin|p[ée]lv|gesta|p[óo]s-parto|pr[óo]stat/i, /p[ée]lvica/i],
    [/esport|atleta|corrida/i, /esportiva/i],
    [/postur|escoliose|cifose|lordose/i, /postural/i],
    [
        /ombro|joelho|tendin|tornozelo|quadril|fratura|entorse|epicondil|impacto/i,
        /^fisioterapia musculoesquel[ée]tica$/i,
    ],
];

export function suggestFor(
    diagnosis: string | undefined,
    templates: AssessmentTemplateSummary[],
): AssessmentTemplateSummary | null {
    if (!diagnosis) return null;
    for (const [dx, tpl] of SUGGESTIONS) {
        if (dx.test(diagnosis)) {
            const hit = templates.find((t) => tpl.test(t.name));
            if (hit) return hit;
        }
    }
    return null;
}

/** Uns 20 segundos por pergunta, para dar ideia do tamanho. */
export function minutesFor(fields: number): string {
    const min = Math.max(1, Math.round((fields * 20) / 60));
    return `cerca de ${min} min`;
}

export function useAssessmentPicker(
    patientId: string,
    /** Sem escolha, usa o modelo indicado (ou o primeiro). */
    autoSelect = false,
) {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [chosenId, setSelectedId] = useState<string | null>(null);
    const templates = useAssessmentTemplates();
    const patient = usePatientDetail(patientId);
    const createAssessment = useCreateAssessment(patientId);

    const all = useMemo(() => templates.data ?? [], [templates.data]);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q
            ? all.filter(
                  (t) =>
                      t.name.toLowerCase().includes(q) ||
                      (t.description ?? '').toLowerCase().includes(q),
              )
            : all;
    }, [all, search]);

    const groups = useMemo(() => {
        const map = new Map<string, AssessmentTemplateSummary[]>();
        for (const t of filtered) {
            const area = areaOf(t.name);
            map.set(area, [...(map.get(area) ?? []), t]);
        }
        return [...map.entries()]
            .sort(([a], [b]) =>
                a === 'Geral' ? -1 : b === 'Geral' ? 1 : a.localeCompare(b),
            )
            .map(([area, items]) => ({ area, items }));
    }, [filtered]);

    const suggested = suggestFor(patient.data?.diagnosis, all);
    const fallback = suggested?.id ?? all[0]?.id;
    const selectedId =
        chosenId ??
        (autoSelect && fallback !== undefined ? String(fallback) : null);
    const selected = useAssessmentTemplate(selectedId);

    function start() {
        if (!selectedId) return;
        createAssessment.mutate(
            { templateId: Number(selectedId), answers: [], answerOptions: [] },
            {
                onSuccess: (assessment) => {
                    navigate(
                        `/clinica/pacientes/${patientId}/avaliacoes/${assessment.id}/editar`,
                    );
                },
            },
        );
    }

    return {
        loading: templates.isLoading,
        creating: createAssessment.isPending,
        all,
        groups,
        search,
        setSearch,
        selectedId,
        /** A escolha veio de um clique (no celular, mostra a prévia). */
        chosen: chosenId !== null,
        select: (id: number | string | null) =>
            setSelectedId(id === null ? null : String(id)),
        selectedSummary: all.find((t) => String(t.id) === selectedId),
        selected: selected.data,
        selectedLoading: selected.isLoading,
        patient: patient.data,
        suggested,
        start,
    };
}

export type AssessmentPicker = ReturnType<typeof useAssessmentPicker>;
