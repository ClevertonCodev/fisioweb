import { PrototypeSwitcher, usePrototypeVariant } from './PrototypeSwitcher';
import {
    AGENDA_PROTOTYPE_VARIANTS,
    AgendaShell,
    type AgendaPrototypeProps,
} from './shared';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';
import { VariantD } from './VariantD';
import { VariantOriginal } from './VariantOriginal';

/**
 * PROTOTYPE (throwaway) — original + três variantes DS da agenda da clínica,
 * trocadas por `?variant=`, na rota real `/clinica/agenda`.
 *
 * Pergunta: como a agenda fica com o design system v2 (tokens `--ds-*`,
 * Poppins, Ds*), ainda debaixo do topbar real e com os dados reais?
 *
 * O Original — tela atual (shadcn v1), para comparar.
 * A Mesma agenda, pele DS — layout de hoje, FullCalendar com tokens DS.
 * B Barra própria + trilho do dia — calendário largo, controles DS, fila de hoje.
 * C Dia por profissional — um dia, uma coluna por fisioterapeuta.
 * D Agenda ampla — calendário grande no estilo da referência agenda-clone.
 *
 * O modal de consulta continua o v1 em todas (fora da pergunta).
 */
export default function AgendaPrototype(props: AgendaPrototypeProps) {
    const variant = usePrototypeVariant(AGENDA_PROTOTYPE_VARIANTS, 'O');

    return (
        <>
            {variant === 'O' ? (
                <VariantOriginal {...props} />
            ) : (
                <AgendaShell data-prototype-variant={variant}>
                    {variant === 'B' ? (
                        <VariantB {...props} />
                    ) : variant === 'C' ? (
                        <VariantC {...props} />
                    ) : variant === 'D' ? (
                        <VariantD {...props} />
                    ) : (
                        <VariantA {...props} />
                    )}
                </AgendaShell>
            )}
            <PrototypeSwitcher
                variants={AGENDA_PROTOTYPE_VARIANTS}
                current={variant}
            />
        </>
    );
}
