import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Landing pública do deep link do programa (QR / compartilhamento).
 * Acessível com ou sem login — a execução completa dos exercícios vem depois.
 */
export default function PatientProgramDeepLinkPage() {
    const { clinicSlug, publicToken } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (publicToken) {
            navigate(`/detalhe-programa?id=${publicToken}`, { replace: true });
        }
    }, [publicToken, navigate]);

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background p-6 text-center overflow-y-auto">
            <h1 className="text-2xl font-semibold text-foreground">
                Carregando programa...
            </h1>
        </div>
    );
}
