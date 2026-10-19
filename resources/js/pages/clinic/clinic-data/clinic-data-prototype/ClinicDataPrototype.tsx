/**
 * PROTÓTIPO (descartável): dados da clínica no DS v2, na rota real
 * /clinica/dados, trocada por ?variant= (O = v1).
 *
 * A, "Cartão de visita ao vivo", é a escolhida (B, ficha em blocos, não
 * foi commitada). Perfil real;
 * salvar é stub. ?mestre=0 mostra como fica para quem não é mestre.
 */
import { Lock, Save } from 'lucide-react';

import { useClinicProfile } from '@/application/clinic/use-clinic-profile';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsAlert, DsButton, DsEmptyState } from '@/components/ds';
import type { ClinicProfile } from '@/domain/clinic';
import { PrototypeSwitcher } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { DATA_VARIANTS, useClinicData } from './shared';
import { VariantA } from './VariantA';

function Screen({ profile }: { profile: ClinicProfile }) {
    const c = useClinicData(profile);
    const bar = c.canEdit;
    return (
        <div className="flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
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
                    {!c.canEdit && (
                        <DsAlert
                            variant="info"
                            title="Só leitura"
                            icon={<Lock />}
                        >
                            Só o usuário mestre da clínica muda estes dados.
                        </DsAlert>
                    )}
                    <VariantA c={c} />
                </div>
            </div>
            {bar && (
                <footer className="flex items-center justify-end gap-2 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 lg:px-8">
                    <span className="mr-auto text-ds-caption text-ds-content-muted">
                        {c.dirty ? 'Alterações não salvas' : 'Tudo salvo'}
                    </span>
                    <DsButton
                        variant="secondary"
                        label="Descartar"
                        disabled={!c.dirty}
                        onClick={c.reset}
                    />
                    <DsButton
                        iconPosition="left"
                        icon={<Save />}
                        label="Salvar"
                        disabled={!c.dirty}
                        onClick={() => c.save()}
                    />
                </footer>
            )}
        </div>
    );
}

function Load() {
    const { data, isLoading } = useClinicProfile();
    if (isLoading)
        return <div className="h-full animate-pulse bg-ds-surface-body" />;
    if (!data) {
        return (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                <DsEmptyState title="Não foi possível carregar os dados" />
            </div>
        );
    }
    return <Screen profile={data} />;
}

export default function ClinicDataPrototype({ variant }: { variant: string }) {
    return (
        <ClinicLayout>
            <Load />
            <PrototypeSwitcher variants={DATA_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
