import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useProgramDraft } from '@/application/clinic/use-program-draft';
import type { ProgramGroup } from '@/domain/clinic';

const getMock = vi.fn();
const saveMock = vi.fn();
const discardMock = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-program-draft', () => ({
    programDraftRepository: {
        get: (...args: unknown[]) => getMock(...args),
        save: (...args: unknown[]) => saveMock(...args),
        discard: (...args: unknown[]) => discardMock(...args),
    },
}));

const DRAFT_KEY = 'clinic_new_program_draft';

describe('useProgramDraft', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('no mount prefere draft do backend quando savedAt é mais recente', async () => {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                step: 1,
                selectedIds: ['old'],
                groups: [],
                savedAt: 1000,
            }),
        );

        getMock.mockResolvedValueOnce({
            step: 2,
            selectedIds: ['backend'],
            groups: [],
            savedAt: 2000,
        });

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        await waitFor(() => {
            expect(result.current.draft?.selectedIds).toEqual(['backend']);
        });

        expect(
            JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'),
        ).toMatchObject({
            selectedIds: ['backend'],
            savedAt: 2000,
        });
    });

    it('no mount mantém draft local quando ele é mais recente que backend', async () => {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                step: 3,
                selectedIds: ['local'],
                groups: [],
                savedAt: 3000,
            }),
        );

        getMock.mockResolvedValueOnce({
            step: 2,
            selectedIds: ['backend'],
            groups: [],
            savedAt: 2000,
        });

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        await waitFor(() => {
            expect(result.current.draft?.selectedIds).toEqual(['local']);
        });
    });

    it('scheduleSave persiste em 500ms no localStorage e em 3s no backend', async () => {
        vi.useFakeTimers();
        vi.spyOn(Date, 'now').mockReturnValue(1711840000000);
        getMock.mockResolvedValueOnce(null);
        saveMock.mockResolvedValueOnce(undefined);

        const groups: ProgramGroup[] = [
            { id: 'g1', name: 'Grupo 1', exercises: [] },
        ];
        const { result } = renderHook(() => useProgramDraft(2, ['10'], groups));

        act(() => {
            result.current.scheduleSave();
        });

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(
            JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}'),
        ).toMatchObject({
            step: 2,
            selectedIds: ['10'],
            savedAt: 1711840000000,
        });

        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(saveMock).toHaveBeenCalledWith({
            step: 2,
            selectedIds: ['10'],
            groups,
            savedAt: 1711840000000,
        });
    });

    it('scheduleSave ignora persistência quando selectedIds e groups estão vazios', () => {
        vi.useFakeTimers();
        getMock.mockResolvedValueOnce(null);

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        act(() => {
            result.current.scheduleSave();
            vi.advanceTimersByTime(3000);
        });

        expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
        expect(saveMock).not.toHaveBeenCalled();
    });

    it('clearDraft limpa localStorage, zera estado e chama discard no backend', async () => {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                step: 2,
                selectedIds: ['x'],
                groups: [],
                savedAt: 1,
            }),
        );
        getMock.mockResolvedValueOnce(null);
        discardMock.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        expect(result.current.hasDraft).toBe(true);

        act(() => {
            result.current.clearDraft();
        });

        await waitFor(() => {
            expect(discardMock).toHaveBeenCalledTimes(1);
        });
        expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
        expect(result.current.hasDraft).toBe(false);
    });

    it('restoreDraft retorna rascunho atual e remove banner local', async () => {
        localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
                step: 4,
                selectedIds: ['rest'],
                groups: [],
                savedAt: 10,
            }),
        );
        getMock.mockResolvedValueOnce(null);

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        let restored: ReturnType<typeof result.current.restoreDraft> = null;
        act(() => {
            restored = result.current.restoreDraft();
        });

        expect(restored).toMatchObject({ step: 4, selectedIds: ['rest'] });
        expect(result.current.hasDraft).toBe(false);
    });
});
