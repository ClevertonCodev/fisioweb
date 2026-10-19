/**
 * PROTÓTIPO (descartável): peças do detalhe do programa. Programa real (useClinicProgram); PDF, texto do prontuário e
 * link são reais (useProgramActions do histórico); duplicar, transformar em
 * modelo e excluir são stub.
 */
import { MessageCircle, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DsButton } from '@/components/ds';
import type { Program, ProgramExercise } from '@/domain/clinic';
import {
    doseParts,
    scheduleOf,
} from '@/pages/clinic/program/program-builder-prototype/builder';
import {
    ProgramActionsMenu,
    useProgramActions,
} from '@/pages/clinic/program/program-history-prototype/shared';

export const DETAIL_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'A', name: 'Painel do programa' },
] as const;

export { doseParts, scheduleOf };

/** Botões do topo: editar, WhatsApp e o menu com o resto. */
export function DetailActions({ program }: { program: Program }) {
    const navigate = useNavigate();
    const { run, deleteModal } = useProgramActions();
    const whatsapp = () => {
        if (!program.patientPhone) {
            toast.error('Paciente sem telefone cadastrado.');
            return;
        }
        toast.info(
            `Protótipo: abriria o WhatsApp de ${program.patientName} com o link do programa.`,
        );
    };
    return (
        <div className="flex flex-wrap items-center gap-2">
            {program.patientId && (
                <DsButton
                    variant="secondary"
                    iconPosition="left"
                    icon={<MessageCircle />}
                    label="WhatsApp"
                    onClick={whatsapp}
                />
            )}
            <DsButton
                iconPosition="left"
                icon={<Pencil />}
                label="Editar"
                onClick={() =>
                    navigate(`/clinica/programas/${program.id}/editar`)
                }
            />
            <ProgramActionsMenu program={program} onAction={run} />
            {deleteModal}
        </div>
    );
}

export function Thumb({
    e,
    className,
}: {
    e: ProgramExercise;
    className?: string;
}) {
    return (
        <span
            className={`block shrink-0 overflow-hidden rounded-ds-md bg-ds-surface-subtle ${className ?? 'size-14'}`}
        >
            {e.thumbnailUrl && (
                <img
                    src={e.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                />
            )}
        </span>
    );
}
