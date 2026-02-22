import { router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { type SharedData } from '@/types';

export default function FlashMessage() {
    const page = usePage<SharedData>();
    const flash = page.props.flash;
    const [isDismissed, setIsDismissed] = useState(false);
    const lastMessageRef = useRef<string | null>(null);
    const dismissedMessagesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const currentMessage = flash?.success || flash?.error;
        if (currentMessage) {
            if (currentMessage !== lastMessageRef.current) {
                if (!dismissedMessagesRef.current.has(currentMessage)) {
                    queueMicrotask(() => setIsDismissed(false));
                    lastMessageRef.current = currentMessage;
                } else {
                    queueMicrotask(() => setIsDismissed(true));
                }
            }
        } else {
            queueMicrotask(() => setIsDismissed(false));
            lastMessageRef.current = null;
        }
    }, [flash?.success, flash?.error]);

    const handleClose = () => {
        const currentMessage = flash?.success || flash?.error;
        if (currentMessage) {
            dismissedMessagesRef.current.add(currentMessage);
            setIsDismissed(true);

            const messageType = flash?.error ? 'error' : 'success';
            const isClinic = window.location.pathname.startsWith('/clinic');
            const clearFlashUrl = isClinic ? '/clinic/clear-flash' : '/admin/clear-flash';
            router.post(
                clearFlashUrl,
                { type: messageType },
                {
                    preserveState: true,
                    preserveScroll: true,
                    only: ['flash'],
                    onSuccess: () => {
                        setIsDismissed(true);
                    },
                }
            );
        }
    };

    // Determinar qual mensagem exibir (prioridade para error)
    const message = flash?.error || flash?.success;
    const isError = !!flash?.error;

    // Se não há mensagem ou foi fechada manualmente, não exibir
    if (!message || isDismissed) {
        return null;
    }

    // Classes baseadas no tipo de mensagem (success ou error)
    const alertClasses = isError
        ? 'border-red-300 bg-red-100 text-red-800'
        : 'border-green-300 bg-green-100 text-green-800';

    const iconClasses = isError
        ? 'text-red-600'
        : 'text-green-600';

    const buttonClasses = isError
        ? 'text-red-600 hover:bg-red-200 focus:ring-red-500'
        : 'text-green-600 hover:bg-green-200 focus:ring-green-500';

    const Icon = isError ? AlertCircle : CheckCircle2;

    return (
        <div
            role="alert"
            className={`mb-4 flex items-center justify-between rounded-md border px-4 py-3 text-sm shadow-sm ${alertClasses}`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`size-5 shrink-0 ${iconClasses}`} />
                <span className="font-medium">{message}</span>
            </div>
            <button
                type="button"
                onClick={handleClose}
                className={`ml-4 shrink-0 rounded-md p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClasses}`}
                aria-label="Fechar mensagem"
            >
                <X className="size-4" />
            </button>
        </div>
    );
}
