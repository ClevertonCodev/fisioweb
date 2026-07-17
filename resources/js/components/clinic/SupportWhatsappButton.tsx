import { MessageCircle } from 'lucide-react';

const SUPPORT_MESSAGE = 'Olá, preciso de ajuda.';

/**
 * Botão flutuante de suporte via WhatsApp.
 * Usa VITE_SUPPORT_WHATSAPP do .env; se não estiver definido, não renderiza nada.
 */
export function SupportWhatsappButton() {
    const raw = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
    const number = (raw ?? '').replace(/\D/g, '');

    if (!number) return null;

    const href = `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(
        SUPPORT_MESSAGE,
    )}`;

    return (
        <div className="group fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
            {/* Balão: escondido, aparece no hover do grupo */}
            <div className="pointer-events-none relative translate-y-1 rounded-2xl border border-border bg-card px-4 py-3 opacity-0 shadow-lg transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                <span className="text-sm font-medium whitespace-nowrap text-foreground">
                    Dúvidas? Fale com nosso suporte
                </span>
                {/* seta apontando pro botão */}
                <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-r border-b border-border bg-card" />
            </div>

            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com o suporte no WhatsApp"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
            >
                <MessageCircle className="h-7 w-7" fill="currentColor" />
            </a>
        </div>
    );
}
