import { useParams } from 'react-router-dom';

/**
 * Landing pública do deep link do programa (QR / compartilhamento).
 * Acessível com ou sem login — a execução completa dos exercícios vem depois.
 */
export default function PatientProgramDeepLinkPage() {
    const { clinicSlug, publicToken } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
                Chegou!
            </h1>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Página pública do programa de exercícios. Em breve você verá a
                lista aqui.
            </p>
            {(clinicSlug || publicToken) && (
                <p className="mt-6 font-mono text-xs text-muted-foreground">
                    {clinicSlug}
                    {publicToken ? ` · ${publicToken.slice(0, 8)}…` : null}
                </p>
            )}
        </div>
    );
}
