export type QuestionType = 'multiple_choice' | 'checkbox' | 'scale' | 'text';

export const questionTypeLabels: Record<QuestionType, string> = {
    multiple_choice: 'Múltipla escolha (única)',
    checkbox: 'Caixas de seleção (múltiplas)',
    scale: 'Escala numérica',
    text: 'Texto livre',
};

export interface DraftQuestion {
    _key: string;
    label: string;
    type: QuestionType;
    options: string[];
    scaleMin: number;
    scaleMax: number;
    required: boolean;
}

export interface DraftSection {
    _key: string;
    title: string;
    questions: DraftQuestion[];
}

export function createDraftQuestion(): DraftQuestion {
    return {
        _key: crypto.randomUUID(),
        label: '',
        type: 'multiple_choice',
        options: ['', ''],
        scaleMin: 0,
        scaleMax: 10,
        required: false,
    };
}

export function createDraftSection(): DraftSection {
    return {
        _key: crypto.randomUUID(),
        title: '',
        questions: [createDraftQuestion()],
    };
}
