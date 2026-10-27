/**
 * PROTÓTIPO (descartável): modelos de evolução no DS v2. O modelo do
 * sistema vem da API; os da clínica marcados "Exemplo" são fixos aqui, só
 * para ver a lista cheia (o banco de exemplo não tem nenhum). Salvar,
 * ativar, duplicar e excluir são stub.
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { useEvolutionTemplates } from '@/application/clinic/use-evolutions';
import type { EvolutionTemplate } from '@/domain/clinic';

export const LIST_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'A', name: 'Cartões com prévia' },
] as const;

export const EDITOR_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'A', name: 'Montar e ver ao vivo' },
] as const;

let seq = 9000;
const item = (label: string, printText: string, free?: string) => ({
    id: ++seq,
    label,
    printText,
    hasFreeText: free !== undefined,
    freeTextPlaceholder: free ?? null,
    sortOrder: seq,
});
const section = (title: string, items: ReturnType<typeof item>[]) => ({
    id: ++seq,
    title,
    sortOrder: seq,
    items,
});

export const DEMO_TEMPLATES: EvolutionTemplate[] = [
    {
        id: -1,
        clinicId: 1,
        name: 'Pós-operatório de LCA',
        description:
            'Fases 1 a 3 do protocolo de reconstrução do ligamento cruzado anterior.',
        isSystem: false,
        isActive: true,
        sections: [
            section('Avaliação da sessão', [
                item('Dor (EVA)', 'Paciente refere dor', 'nota de 0 a 10'),
                item(
                    'Edema',
                    'Edema em joelho operado',
                    'leve, moderado ou acentuado',
                ),
                item('ADM de flexão', 'ADM de flexão do joelho', 'graus'),
            ]),
            section('Condutas', [
                item('Crioterapia', 'Realizada crioterapia por 20 minutos.'),
                item(
                    'Mobilização patelar',
                    'Realizada mobilização patelar em todas as direções.',
                ),
                item(
                    'Isometria de quadríceps',
                    'Realizados exercícios isométricos de quadríceps.',
                ),
                item('Bicicleta', 'Bicicleta ergométrica sem carga', 'minutos'),
            ]),
            section('Orientações', [
                item(
                    'Uso de muletas',
                    'Orientado uso de muletas com descarga parcial.',
                ),
                item(
                    'Exercícios em casa',
                    'Reforçado programa de exercícios domiciliares.',
                ),
            ]),
        ],
    },
    {
        id: -2,
        clinicId: 1,
        name: 'Pilates clínico',
        description: 'Sessão de pilates com foco em estabilização.',
        isSystem: false,
        isActive: true,
        sections: [
            section('Aparelhos', [
                item('Reformer', 'Exercícios no Reformer', 'molas e séries'),
                item('Cadillac', 'Exercícios no Cadillac', 'molas e séries'),
                item('Chair', 'Exercícios na Chair'),
            ]),
            section('Foco da aula', [
                item(
                    'Estabilização lombo-pélvica',
                    'Trabalhada estabilização lombo-pélvica.',
                ),
                item('Respiração', 'Trabalhado padrão respiratório.'),
            ]),
        ],
    },
    {
        id: -3,
        clinicId: 1,
        name: 'Atendimento domiciliar (antigo)',
        description: null,
        isSystem: false,
        isActive: false,
        sections: [
            section('Condutas', [
                item(
                    'Marcha assistida',
                    'Realizado treino de marcha assistida',
                    'metros',
                ),
                item(
                    'Transferências',
                    'Treino de transferências cama-cadeira.',
                ),
            ]),
        ],
    },
];

export function sortedSections(t: EvolutionTemplate) {
    return [...t.sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
            ...s,
            items: [...s.items].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
}

export function itemCount(t: EvolutionTemplate) {
    return t.sections.reduce((n, s) => n + s.items.length, 0);
}

/** Lista real (sistema) + exemplos da clínica. */
export function useTemplateList() {
    const q = useEvolutionTemplates();
    const real = q.data ?? [];
    return {
        loading: q.isLoading,
        all: [...real, ...DEMO_TEMPLATES],
        isDemo: (t: EvolutionTemplate) => t.id < 0,
    };
}

// ---------------------------------------------------------------- rascunho

export interface DraftItem {
    key: string;
    label: string;
    printText: string;
    hasFreeText: boolean;
    placeholder: string;
}
export interface DraftSection {
    key: string;
    title: string;
    items: DraftItem[];
}

const newKey = () => crypto.randomUUID();
export const emptyItem = (): DraftItem => ({
    key: newKey(),
    label: '',
    printText: '',
    hasFreeText: false,
    placeholder: '',
});
export const emptySection = (): DraftSection => ({
    key: newKey(),
    title: '',
    items: [emptyItem()],
});

export function toDraft(t: EvolutionTemplate | null): DraftSection[] {
    if (!t) return [emptySection()];
    return sortedSections(t).map((s) => ({
        key: newKey(),
        title: s.title,
        items: s.items.map((i) => ({
            key: newKey(),
            label: i.label,
            printText: i.printText,
            hasFreeText: i.hasFreeText,
            placeholder: i.freeTextPlaceholder ?? '',
        })),
    }));
}

export function problemsOf(name: string, sections: DraftSection[]): string[] {
    const out: string[] = [];
    if (!name.trim()) out.push('Dê um nome ao modelo.');
    if (sections.length === 0) out.push('Adicione ao menos uma seção.');
    sections.forEach((s, i) => {
        if (!s.title.trim()) out.push(`A seção ${i + 1} está sem título.`);
        if (s.items.length === 0) out.push(`A seção ${i + 1} não tem itens.`);
        s.items.forEach((it, j) => {
            if (!it.label.trim() || !it.printText.trim()) {
                out.push(
                    `Item ${j + 1} da seção ${i + 1}: falta ${!it.label.trim() ? 'o nome' : 'o texto do prontuário'}.`,
                );
            }
        });
    });
    return out;
}

export function useTemplateDraft(t: EvolutionTemplate | null) {
    const [name, setName] = useState(t?.name ?? '');
    const [description, setDescription] = useState(t?.description ?? '');
    const [sections, setSections] = useState<DraftSection[]>(() => toDraft(t));

    const patchSection = (key: string, patch: Partial<DraftSection>) =>
        setSections((all) =>
            all.map((s) => (s.key === key ? { ...s, ...patch } : s)),
        );
    const patchItem = (sk: string, ik: string, patch: Partial<DraftItem>) =>
        setSections((all) =>
            all.map((s) =>
                s.key === sk
                    ? {
                          ...s,
                          items: s.items.map((i) =>
                              i.key === ik ? { ...i, ...patch } : i,
                          ),
                      }
                    : s,
            ),
        );
    const move = <T>(list: T[], from: number, to: number) => {
        if (to < 0 || to >= list.length) return list;
        const next = [...list];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x as T);
        return next;
    };
    const problems = problemsOf(name, sections);

    return {
        name,
        setName,
        description,
        setDescription,
        sections,
        setSections,
        patchSection,
        patchItem,
        addSection: () => setSections((all) => [...all, emptySection()]),
        removeSection: (key: string) =>
            setSections((all) => all.filter((s) => s.key !== key)),
        moveSection: (from: number, to: number) =>
            setSections((all) => move(all, from, to)),
        addItem: (sk: string) =>
            setSections((all) =>
                all.map((s) =>
                    s.key === sk
                        ? { ...s, items: [...s.items, emptyItem()] }
                        : s,
                ),
            ),
        removeItem: (sk: string, ik: string) =>
            setSections((all) =>
                all.map((s) =>
                    s.key === sk
                        ? { ...s, items: s.items.filter((i) => i.key !== ik) }
                        : s,
                ),
            ),
        moveItem: (sk: string, from: number, to: number) =>
            setSections((all) =>
                all.map((s) =>
                    s.key === sk ? { ...s, items: move(s.items, from, to) } : s,
                ),
            ),
        problems,
        itemTotal: sections.reduce((n, s) => n + s.items.length, 0),
        save: () => {
            if (problems.length) {
                toast.error(problems[0]);
                return;
            }
            toast.success(`Protótipo: "${name.trim()}" não foi salvo.`);
        },
    };
}

export type TemplateDraft = ReturnType<typeof useTemplateDraft>;

/** Linha do prontuário, no formato do backend (EvolutionService::generateText). */
export function lineOf(
    i: { printText: string; hasFreeText: boolean },
    free?: string,
) {
    return i.hasFreeText && free?.trim()
        ? `${i.printText} — ${free.trim()}`
        : i.printText;
}
