import type { ReactNode, Ref } from 'react';

export type DatepickerMode = 'range' | 'single';

export interface DateRange {
    start: Date | null;
    end: Date | null;
}

export interface DatepickerPreset {
    key: string;
    label: string;
    range: () => DateRange;
}

export type DatepickerValue = Date | DateRange | null;

export interface DatepickerTriggerState {
    /** Texto que o campo mostraria (data, intervalo ou placeholder). */
    label: string;
    open: boolean;
}

export interface DatepickerProps {
    /**
     * Valor (no Vue: modelValue). `Date` no modo single, `DateRange` no range.
     * Sem `value`, o componente guarda a escolha sozinho.
     */
    value?: DatepickerValue;
    /**
     * Single: chamado ao clicar no dia. Range: só no "Aplicar", com o intervalo
     * como estiver (pode vir com `end: null`, igual ao Vue).
     */
    onValueChange?: (value: DatepickerValue) => void;
    mode?: DatepickerMode;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
    /** Atalhos da lateral (só no range). Vazio usa os atalhos padrão. */
    presets?: DatepickerPreset[];
    /** Conteúdo do gatilho (no Vue: slot `trigger` com `{ label, open }`). */
    trigger?: (state: DatepickerTriggerState) => ReactNode;
    id?: string;
    className?: string;
    ref?: Ref<HTMLButtonElement>;
}
