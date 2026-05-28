import { useNavigate, useRouteError } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';

export function ClinicLoaderError() {
    const error = useRouteError();
    const navigate = useNavigate();

    const message =
        error instanceof Error
            ? error.message
            : ((error as { statusText?: string })?.statusText ?? 'Erro desconhecido');

    return (
        <ClinicLayout>
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-muted-foreground text-sm">Não foi possível carregar os dados.</p>
                <p className="text-destructive font-mono text-sm">{message}</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Voltar
                    </Button>
                    <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
                </div>
            </div>
        </ClinicLayout>
    );
}
