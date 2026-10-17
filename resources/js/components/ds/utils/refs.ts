import type { Ref, RefCallback } from 'react';

/** Junta várias refs (a do pai e a interna do componente) numa só. */
export function mergeRefs<T>(
    ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
    return (node) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
        }
    };
}

/**
 * Troca o valor de um input e dispara o evento `input` nativo, para que o
 * onChange do React rode, inclusive com register do React Hook Form
 * (campo não controlado).
 */
export function setNativeInputValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
) {
    const prototype =
        element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
}
