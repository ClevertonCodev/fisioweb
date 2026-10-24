import { useEffect, useState, type RefObject } from 'react';

/**
 * Vira true na primeira vez que o elemento chega perto da tela e fica assim.
 * Serve para adiar busca de detalhe até o cartão aparecer.
 */
export function useInView(
    ref: RefObject<Element | null>,
    rootMargin = '200px',
): boolean {
    const [seen, setSeen] = useState(
        () => typeof IntersectionObserver === 'undefined',
    );

    useEffect(() => {
        const el = ref.current;
        if (seen || !el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) setSeen(true);
            },
            { rootMargin },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, rootMargin, seen]);

    return seen;
}
