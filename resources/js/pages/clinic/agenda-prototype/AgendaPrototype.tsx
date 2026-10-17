import { PrototypeSwitcher, usePrototypeVariant } from './PrototypeSwitcher';
import {
    AGENDA_PROTOTYPE_VARIANTS,
    AgendaShell,
    type AgendaPrototypeProps,
} from './shared';
import { VariantA } from './VariantA';
import { VariantOriginal } from './VariantOriginal';

/**
 * PROTOTYPE (throwaway) — agenda da clínica no design system v2, trocada por
 * `?variant=` na rota real `/clinica/agenda`.
 *
 * O Original — tela atual (shadcn v1), para comparar.
 * A Escolhida: coluna da esquerda flutuante (abre ao passar o mouse na
 *   borda, com alfinete para fixar), calendário em altura total, consultas
 *   em fundo suave com faixa de status.
 *
 * Variantes descartadas (B, C, D, A fixa, A1 recolhível, A3 gaveta) estão no
 * commit e415a8c da branch feat/prototipo. O modal de consulta continua o v1.
 */
export default function AgendaPrototype(props: AgendaPrototypeProps) {
    const variant = usePrototypeVariant(AGENDA_PROTOTYPE_VARIANTS, 'A');

    return (
        <>
            {variant === 'O' ? (
                <VariantOriginal {...props} />
            ) : (
                <AgendaShell data-prototype-variant={variant}>
                    <VariantA {...props} />
                </AgendaShell>
            )}
            <PrototypeSwitcher
                variants={AGENDA_PROTOTYPE_VARIANTS}
                current={variant}
            />
        </>
    );
}
