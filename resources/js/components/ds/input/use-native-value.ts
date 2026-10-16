import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

type NativeField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Espelha o valor de um campo não controlado (ex.: register do React Hook Form).
 *
 * O RHF escreve `element.value` direto no DOM, sem evento, ao aplicar
 * `defaultValues`, em `reset()` e em `setValue()`, e o setValue nem sempre
 * re-renderiza. Por isso o espelho lê o DOM ao montar e intercepta a escrita
 * em `value` no próprio elemento (encadeando com o descritor que já estiver
 * lá, como o do React).
 *
 * O reset do próprio `<form>` (`<button type="reset">`, `reset()` do RHF sem
 * valor para o campo, o reset do React 19 depois de `<form action>`) volta o
 * valor sem passar pelo setter e sem evento `input`. O evento `reset` dispara
 * antes de o form aplicar o reset, então o valor é relido numa macrotask
 * (`setTimeout`). Microtask não serve: num clique real no botão, a pilha de JS
 * está vazia e as microtasks rodam antes de o form aplicar o reset.
 *
 * Com `controlledValue` definido, devolve ele e não toca no elemento.
 */
export function useNativeValue(
    elementRef: RefObject<NativeField | null>,
    controlledValue: string | undefined,
    initialValue: string,
): [string, (next: string) => void] {
    const [mirror, setMirror] = useState(initialValue);
    const controlled = controlledValue !== undefined;

    useLayoutEffect(() => {
        const element = elementRef.current;
        if (controlled || !element) return;

        const own = Object.getOwnPropertyDescriptor(element, 'value');
        const base =
            own ??
            Object.getOwnPropertyDescriptor(
                Object.getPrototypeOf(element),
                'value',
            );
        if (!base?.get || !base.set) return;
        const { get, set } = base;

        // O register do RHF aplica os defaultValues no ref, antes deste efeito.
        setMirror(get.call(element));

        Object.defineProperty(element, 'value', {
            configurable: true,
            enumerable: base.enumerable,
            get() {
                return get.call(this);
            },
            set(next: string) {
                set.call(this, next);
                setMirror(get.call(this));
            },
        });

        const form = element.form;
        let pending: ReturnType<typeof setTimeout> | undefined;
        const handleReset = () => {
            clearTimeout(pending);
            pending = setTimeout(() => setMirror(get.call(element)), 0);
        };
        form?.addEventListener('reset', handleReset);

        return () => {
            clearTimeout(pending);
            form?.removeEventListener('reset', handleReset);
            if (own) Object.defineProperty(element, 'value', own);
            else delete (element as { value?: string }).value;
        };
    }, [elementRef, controlled]);

    return [controlled ? controlledValue : mirror, setMirror];
}
