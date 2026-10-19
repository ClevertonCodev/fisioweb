/**
 * PROTÓTIPO A, "Cartão de visita ao vivo": o formulário de um lado e, do
 * outro, onde esses dados aparecem para o paciente, mudando enquanto se
 * digita: o topo do PDF do programa (telefone), uma sugestão de mensagem
 * com o link e o endereço do link, que não muda.
 */
import { CircleAlert, Link2, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { DsBadge, DsButton } from '@/components/ds';

import { AddressFields, ContactFields, IdentityFields } from './parts';
import { type ClinicData, STATUS_LABEL } from './shared';

function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs">
            <h2 className="text-ds-body-sm font-semibold">{title}</h2>
            {children}
        </section>
    );
}

export function VariantA({ c }: { c: ClinicData }) {
    const { form, profile } = c;
    const status = STATUS_LABEL[String(profile.status)];

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-4">
                <Card title="Identidade">
                    <IdentityFields c={c} />
                </Card>
                <Card title="Contato">
                    <ContactFields c={c} />
                </Card>
                <Card title="Endereço">
                    <AddressFields c={c} />
                </Card>
                <Card title="Conta">
                    <dl className="grid grid-cols-1 gap-3 text-ds-body-xs sm:grid-cols-3">
                        <div>
                            <dt className="text-ds-caption text-ds-content-muted">
                                Situação
                            </dt>
                            <dd className="mt-1">
                                {status && (
                                    <DsBadge variant={status.variant} dot>
                                        {status.label}
                                    </DsBadge>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-ds-caption text-ds-content-muted">
                                Plano
                            </dt>
                            <dd className="mt-1 font-medium">
                                {profile.planName ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-ds-caption text-ds-content-muted">
                                Código da clínica
                            </dt>
                            <dd className="mt-1 font-ds-mono">#{profile.id}</dd>
                        </div>
                    </dl>
                </Card>
            </div>

            <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
                <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                    Como o paciente vê
                </p>

                {/* Topo do PDF do programa: nome e e-mail são do profissional;
                    o telefone é o da clínica (ProgramPdfViewModelBuilder). */}
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
                                    form.phone
                                        ? 'text-[11px] font-medium'
                                        : 'text-[11px] text-[#c0392b]'
                                }
                            >
                                {form.phone ||
                                    'Telefone da clínica não preenchido'}
                            </p>
                        </div>
                        <div className="mt-3 flex flex-col gap-1.5">
                            <span className="h-2 w-2/3 rounded-ds-pill bg-[#e3e5ea]" />
                            <span className="h-2 w-1/2 rounded-ds-pill bg-[#e3e5ea]" />
                        </div>
                    </div>
                </figure>

                {/* Mensagem do WhatsApp */}
                <figure className="flex flex-col gap-1.5">
                    <figcaption className="text-ds-caption text-ds-content-secondary">
                        Sugestão: mensagem com o link
                    </figcaption>
                    <div className="rounded-ds-lg bg-[#e7ddd3] p-3 ds-dark:bg-[#0b141a]">
                        <div className="ml-auto max-w-[90%] rounded-ds-md rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[12px] text-[#111b21] shadow-ds-xs ds-dark:bg-[#005c4b] ds-dark:text-[#e9edef]">
                            Olá! Aqui é da <b>{form.name || 'sua clínica'}</b>.
                            Seu programa de exercícios está pronto:
                            <span className="mt-1 block truncate text-[#027eb5] underline ds-dark:text-[#53bdeb]">
                                https://{c.patientLink}
                            </span>
                            {form.phone && (
                                <span className="mt-1 block">
                                    Dúvidas? {form.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </figure>

                {/* Endereço do link */}
                <div className="flex items-center gap-2 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default px-3 py-2.5">
                    <Link2 className="size-4 shrink-0 text-ds-content-muted" />
                    <span className="min-w-0 flex-1 truncate font-ds-mono text-ds-caption">
                        {c.patientLink}
                    </span>
                    <DsButton
                        iconPosition="only"
                        size="sm"
                        variant="tertiary"
                        icon={<Lock />}
                        tooltip="O endereço não muda: links já enviados deixariam de abrir"
                        onClick={() =>
                            toast.info(
                                'O endereço do link é fixo: mudar quebraria os links já enviados aos pacientes.',
                            )
                        }
                    />
                </div>

                {!form.phone && (
                    <p className="flex items-start gap-2 rounded-ds-lg bg-ds-status-warning-surface px-3 py-2.5 text-ds-caption text-ds-status-warning-content">
                        <CircleAlert className="mt-px size-4 shrink-0" />
                        Sem telefone, o PDF do programa sai sem contato da
                        clínica.
                    </p>
                )}
            </aside>
        </div>
    );
}
