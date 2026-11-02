import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
    clinicProfileFormSchema,
    clinicProfileFormToUpdateDto,
    type ClinicProfileFormValues,
} from '@/application/clinic/clinic-profile-form';
import { can } from '@/application/clinic/permissions';
import { useUpdateClinicProfile } from '@/application/clinic/use-clinic-profile';
import { DsAlert, DsBadge, DsButton } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicProfile } from '@/domain/clinic/clinic-profile';

import {
    CLINIC_STATUS_LABEL,
    clinicPatientProgramLinkPreview,
    presentClinicProfileFormValues,
} from './clinic-data-ui';
import {
    AddressFields,
    ContactFields,
    IdentityFields,
} from './ClinicDataFields';
import { PatientViewPreview } from './PatientViewPreview';

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

export function ClinicDataForm({ profile }: { profile: ClinicProfile }) {
    const { user } = useAuth();
    const canEdit = can.editClinicData(user?.mestre);
    const updateProfile = useUpdateClinicProfile();
    const form = useForm<ClinicProfileFormValues>({
        resolver: zodResolver(clinicProfileFormSchema),
        mode: 'onTouched',
        defaultValues: presentClinicProfileFormValues(profile),
    });
    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = form;

    useEffect(() => {
        reset(presentClinicProfileFormValues(profile));
    }, [profile, reset]);

    const name = useWatch({ control, name: 'name' }) ?? '';
    const phone = useWatch({ control, name: 'phone' }) ?? '';
    const patientLink = clinicPatientProgramLinkPreview(
        window.location.host,
        profile.slug,
    );
    const status = CLINIC_STATUS_LABEL[String(profile.status)];

    const onSubmit = (values: ClinicProfileFormValues) => {
        updateProfile.mutate(
            clinicProfileFormToUpdateDto(values, profile.status),
        );
    };

    const fields = {
        canEdit,
        control,
        errors,
        register,
        setValue,
        watch,
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-ds-surface-body font-ds text-ds-content-primary"
        >
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <header>
                        <h1 className="text-ds-h4 font-semibold">
                            Dados da clínica
                        </h1>
                        <p className="text-ds-body-xs text-ds-content-secondary">
                            O que identifica a clínica para pacientes e no
                            sistema.
                        </p>
                    </header>
                    {!canEdit && (
                        <DsAlert
                            variant="info"
                            title="Só leitura"
                            icon={<Lock />}
                        >
                            Só o usuário mestre da clínica muda estes dados.
                        </DsAlert>
                    )}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="flex min-w-0 flex-col gap-4">
                            <Card title="Identidade">
                                <IdentityFields {...fields} />
                            </Card>
                            <Card title="Contato">
                                <ContactFields {...fields} />
                            </Card>
                            <Card title="Endereço">
                                <AddressFields {...fields} />
                            </Card>
                            <Card title="Conta">
                                <dl className="grid grid-cols-1 gap-3 text-ds-body-xs sm:grid-cols-3">
                                    <div>
                                        <dt className="text-ds-caption text-ds-content-muted">
                                            Situação
                                        </dt>
                                        <dd className="mt-1">
                                            {status && (
                                                <DsBadge
                                                    variant={status.variant}
                                                    dot
                                                >
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
                                        <dd className="mt-1 font-ds-mono">
                                            #{profile.id}
                                        </dd>
                                    </div>
                                </dl>
                            </Card>
                        </div>
                        <PatientViewPreview
                            name={name}
                            phone={phone}
                            patientLink={patientLink}
                        />
                    </div>
                </div>
            </div>
            {canEdit && (
                <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 lg:px-8">
                    <span className="mr-auto text-ds-caption text-ds-content-muted">
                        {isDirty ? 'Alterações não salvas' : 'Tudo salvo'}
                    </span>
                    <DsButton
                        type="button"
                        variant="secondary"
                        label="Descartar"
                        disabled={!isDirty}
                        onClick={() =>
                            reset(presentClinicProfileFormValues(profile))
                        }
                    />
                    <DsButton
                        type="submit"
                        iconPosition="left"
                        icon={<Save />}
                        label="Salvar"
                        disabled={!isDirty}
                        loading={updateProfile.isPending}
                    />
                </footer>
            )}
        </form>
    );
}
