import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Landing mínima para deep link do QR no PDF do programa.
 * O identificador na URL é um public_token (UUID), não o id sequencial.
 * Login completo do paciente fica fora do escopo desta feature.
 */
export default function PatientProgramDeepLinkPage() {
    const { clinicSlug } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
            <Card className="w-full max-w-md p-8 text-center">
                <h1 className="text-xl font-semibold text-foreground">
                    Acesso ao programa
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Para ver seu programa de exercícios, faça login como
                    paciente na clínica. Se você já tem cadastro, use o app ou
                    portal da clínica com suas credenciais.
                </p>
                {clinicSlug && (
                    <p className="mt-4 text-xs text-muted-foreground">
                        Clínica{' '}
                        <span className="font-medium text-foreground">
                            {clinicSlug}
                        </span>
                    </p>
                )}
                <div className="mt-6 flex flex-col gap-2">
                    <Button asChild variant="default" className="cursor-pointer">
                        <Link to="/clinica/login">
                            Ir para login da clínica
                        </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Em breve: acesso direto ao programa após login do
                        paciente.
                    </p>
                </div>
            </Card>
        </div>
    );
}
