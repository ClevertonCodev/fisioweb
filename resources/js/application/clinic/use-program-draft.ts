import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProgramGroup, ProgramStep } from '@/domain/clinic';
import { programDraftRepository } from '@/infrastructure/repositories/api-clinic-program-draft';

const DRAFT_KEY = 'clinic_new_program_draft';

export interface ProgramDraft {
    step: ProgramStep;
    selectedIds: string[];
    groups: ProgramGroup[];
    savedAt: number;
}

function loadFromStorage(): ProgramDraft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ProgramDraft;
        if (typeof parsed.step !== 'number') return null;
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Rascunho do "Novo programa". Com `enabled` falso (editar ou montar modelo),
 * o hook não lê, não grava e não apaga o rascunho de quem estava no meio de
 * um programa novo.
 */
export function useProgramDraft(
    step: ProgramStep,
    selectedIds: string[],
    groups: ProgramGroup[],
    enabled = true,
) {
    const [draft, setDraft] = useState<ProgramDraft | null>(() =>
        enabled ? loadFromStorage() : null,
    );
    const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialFetchDone = useRef(false);

    // On mount: busca do backend e prefere o rascunho mais recente
    useEffect(() => {
        if (!enabled || initialFetchDone.current) return;
        initialFetchDone.current = true;

        programDraftRepository.get().then((backendDraft) => {
            if (!backendDraft) return;
            setDraft((current) => {
                // Prefere o rascunho com savedAt mais recente
                if (current && current.savedAt >= backendDraft.savedAt)
                    return current;
                try {
                    localStorage.setItem(
                        DRAFT_KEY,
                        JSON.stringify(backendDraft),
                    );
                } catch {
                    // quota exceeded — silencioso
                }
                return backendDraft;
            });
        });
    }, [enabled]);

    // O que cada timer ainda vai gravar; ao sair da tela, grava na hora.
    const pendingLocalRef = useRef<(() => void) | null>(null);
    const pendingBackendRef = useRef<(() => void) | null>(null);

    useEffect(
        () => () => {
            if (localTimerRef.current) clearTimeout(localTimerRef.current);
            if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
            pendingLocalRef.current?.();
            pendingBackendRef.current?.();
        },
        [],
    );

    const scheduleSave = useCallback(() => {
        if (!enabled) return;
        const isEmpty = selectedIds.length === 0 && groups.length === 0;

        // 500ms → localStorage (feedback imediato)
        if (localTimerRef.current) clearTimeout(localTimerRef.current);
        pendingLocalRef.current = () => {
            pendingLocalRef.current = null;
            localTimerRef.current = null;
            if (isEmpty) return;
            try {
                localStorage.setItem(
                    DRAFT_KEY,
                    JSON.stringify({
                        step,
                        selectedIds,
                        groups,
                        savedAt: Date.now(),
                    }),
                );
            } catch {
                // quota exceeded — silencioso
            }
        };
        localTimerRef.current = setTimeout(
            () => pendingLocalRef.current?.(),
            500,
        );

        // 3s → backend (persistência cross-device)
        if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
        pendingBackendRef.current = () => {
            pendingBackendRef.current = null;
            backendTimerRef.current = null;
            if (isEmpty) return;
            const payload: ProgramDraft = {
                step,
                selectedIds,
                groups,
                savedAt: Date.now(),
            };
            programDraftRepository.save(payload).catch(() => {
                // falha silenciosa — localStorage já garantiu o rascunho local
            });
        };
        backendTimerRef.current = setTimeout(
            () => pendingBackendRef.current?.(),
            3000,
        );
    }, [enabled, step, selectedIds, groups]);

    const clearDraft = useCallback(() => {
        if (!enabled) return;
        if (localTimerRef.current) clearTimeout(localTimerRef.current);
        if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
        pendingLocalRef.current = null;
        pendingBackendRef.current = null;
        localStorage.removeItem(DRAFT_KEY);
        setDraft(null);
        programDraftRepository.discard().catch(() => {
            // silencioso
        });
    }, [enabled]);

    const restoreDraft = useCallback((): ProgramDraft | null => {
        const d = draft;
        setDraft(null); // fechar banner
        return d;
    }, [draft]);

    return {
        draft,
        hasDraft: draft !== null,
        scheduleSave,
        clearDraft,
        restoreDraft,
    };
}
