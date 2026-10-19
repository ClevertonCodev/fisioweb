import { CircleAlert, Link2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { DsButton } from '@/components/ds';

type PatientViewPreviewProps = {
    name: string;
    phone: string;
    patientLink: string;
};

export function PatientViewPreview({
    name,
    phone,
    patientLink,
}: PatientViewPreviewProps) {
    return (
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
            <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                Como o paciente vê
            </p>

            <figure className="flex flex-col gap-1.5">
                <figcaption className="text-ds-caption text-ds-content-secondary">
                    No PDF do programa
                </figcaption>
                <div className="rounded-ds-md border border-ds-border-subtle bg-ds-white p-4 text-[#1f2430] shadow-ds-sm">
                    <div className="border-b-2 border-[#1f2430] pb-2">
                        <p className="text-[13px] font-semibold">
                            Fisioterapeuta responsável
                        </p>
                        <p className="text-[10px] text-[#6b7180]">
                            e-mail do profissional
                        </p>
                        <p
                            className={
                                phone
                                    ? 'text-[11px] font-medium'
                                    : 'text-[11px] text-[#c0392b]'
                            }
                        >
                            {phone || 'Telefone da clínica não preenchido'}
                        </p>
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                        <span className="h-2 w-2/3 rounded-ds-pill bg-[#e3e5ea]" />
                        <span className="h-2 w-1/2 rounded-ds-pill bg-[#e3e5ea]" />
                    </div>
                </div>
            </figure>

            <figure className="flex flex-col gap-1.5">
                <figcaption className="text-ds-caption text-ds-content-secondary">
                    Sugestão: mensagem com o link
                </figcaption>
                <div className="rounded-ds-lg bg-[#e7ddd3] p-3 ds-dark:bg-[#0b141a]">
                    <div className="ml-auto max-w-[90%] rounded-ds-md rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[12px] text-[#111b21] shadow-ds-xs ds-dark:bg-[#005c4b] ds-dark:text-[#e9edef]">
                        Olá! Aqui é da <b>{name || 'sua clínica'}</b>. Seu
                        programa de exercícios está pronto:
                        <span className="mt-1 block truncate text-[#027eb5] underline ds-dark:text-[#53bdeb]">
                            https://{patientLink}
                        </span>
                        {phone && (
                            <span className="mt-1 block">Dúvidas? {phone}</span>
                        )}
                    </div>
                </div>
            </figure>

            <div className="flex items-center gap-2 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default px-3 py-2.5">
                <Link2 className="size-4 shrink-0 text-ds-content-muted" />
                <span className="min-w-0 flex-1 truncate font-ds-mono text-ds-caption">
                    {patientLink}
                </span>
                <DsButton
                    type="button"
                    iconPosition="only"
                    size="sm"
                    variant="tertiary"
                    icon={<Lock />}
                    label="O endereço do link é fixo"
                    tooltip="O endereço não muda: links já enviados deixariam de abrir"
                    onClick={() =>
                        toast.info(
                            'O endereço do link é fixo: mudar quebraria os links já enviados aos pacientes.',
                        )
                    }
                />
            </div>

            {!phone && (
                <p className="flex items-start gap-2 rounded-ds-lg bg-ds-status-warning-surface px-3 py-2.5 text-ds-caption text-ds-status-warning-content">
                    <CircleAlert className="mt-px size-4 shrink-0" />
                    Sem telefone, o PDF do programa sai sem contato da clínica.
                </p>
            )}
        </aside>
    );
}
