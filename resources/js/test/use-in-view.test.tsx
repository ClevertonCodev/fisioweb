import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useInView } from '@/pages/clinic/use-in-view';

describe('useInView', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('vira true quando o elemento entra na tela e para de observar', () => {
        let callback: IntersectionObserverCallback | null = null;
        const disconnect = vi.fn();
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: IntersectionObserverCallback) {
                    callback = cb;
                }
                observe() {}
                disconnect = disconnect;
            },
        );
        const ref = { current: document.createElement('div') };

        const { result } = renderHook(() => useInView(ref));
        expect(result.current).toBe(false);

        act(() => {
            callback?.(
                [{ isIntersecting: true } as IntersectionObserverEntry],
                {} as IntersectionObserver,
            );
        });
        expect(result.current).toBe(true);
        expect(disconnect).toHaveBeenCalled();
    });

    it('sem IntersectionObserver, considera visível', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const ref = { current: document.createElement('div') };
        const { result } = renderHook(() => useInView(ref));
        expect(result.current).toBe(true);
    });
});
