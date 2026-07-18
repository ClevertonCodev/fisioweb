import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { setSessionAuth } from '@/infrastructure/api/client';

const IMPERSONATE_KEY_PREFIX = '_imp_';

export default function ImpersonatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setUser } = useAuth();

    // A chave é consumida (e removida) uma única vez. O ref garante isso mesmo
    // com as dependências declaradas corretamente.
    const consumedRef = useRef(false);

    useEffect(() => {
        if (consumedRef.current) return;
        consumedRef.current = true;

        const key = searchParams.get('key');

        if (!key || !key.startsWith(IMPERSONATE_KEY_PREFIX)) {
            navigate('/clinica/login', { replace: true });
            return;
        }

        const raw = localStorage.getItem(key);
        localStorage.removeItem(key);

        if (!raw) {
            navigate('/clinica/login', { replace: true });
            return;
        }

        try {
            const { token, guard, user } = JSON.parse(raw) as {
                token: string;
                guard: string;
                user: { id: number; name: string; email: string };
            };

            setSessionAuth(token, guard);
            setUser(
                { id: user.id, name: user.name, email: user.email },
                'clinic',
            );
            navigate('/clinica', { replace: true });
        } catch {
            navigate('/clinica/login', { replace: true });
        }
    }, [navigate, searchParams, setUser]);

    return null;
}
