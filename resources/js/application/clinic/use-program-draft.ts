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

export function useProgramDraft(
    step: ProgramStep,
    selectedIds: string[],
    groups: ProgramGroup[],
) {
    const [draft, setDraft] = useState<ProgramDraft | null>(loadFromStorage);
    const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialFetchDone = useRef(false);

    // On mount: busca do backend e prefere o rascunho mais recente
    useEffect(() => {
        if (initialFetchDone.current) return;
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
    }, []);

    const scheduleSave = useCallback(() => {
        // 500ms → localStorage (feedback imediato)
        if (localTimerRef.current) clearTimeout(localTimerRef.current);
        localTimerRef.current = setTimeout(() => {
            if (selectedIds.length === 0 && groups.length === 0) return;
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
        }, 500);

        // 3s → backend (persistência cross-device)
        if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
        backendTimerRef.current = setTimeout(() => {
            if (selectedIds.length === 0 && groups.length === 0) return;
            const payload: ProgramDraft = {
                step,
                selectedIds,
                groups,
                savedAt: Date.now(),
            };
            programDraftRepository.save(payload).catch(() => {
                // falha silenciosa — localStorage já garantiu o rascunho local
            });
        }, 3000);
    }, [step, selectedIds, groups]);

    const clearDraft = useCallback(() => {
        if (localTimerRef.current) clearTimeout(localTimerRef.current);
        if (backendTimerRef.current) clearTimeout(backendTimerRef.current);
        localStorage.removeItem(DRAFT_KEY);
        setDraft(null);
        programDraftRepository.discard().catch(() => {
            // silencioso
        });
    }, []);

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
