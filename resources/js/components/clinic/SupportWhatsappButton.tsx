import { MessageCircle } from 'lucide-react';

export const SUPPORT_MESSAGE = 'Olá, preciso de ajuda.';

/** Número de suporte (só dígitos) a partir de VITE_SUPPORT_WHATSAPP. */
export function getSupportWhatsappNumber(): string {
    const raw = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
    return (raw ?? '').replace(/\D/g, '');
}

/** URL do WhatsApp Web/App para o suporte, ou null se não configurado. */
export function getSupportWhatsappHref(): string | null {
    const number = getSupportWhatsappNumber();
    if (!number) return null;
    return `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(
        SUPPORT_MESSAGE,
    )}`;
}

/**
 * Botão flutuante de suporte via WhatsApp.
 * Mantido no código, mas não montado no layout — o acesso fica no menu da conta
 * (`ClinicUserDropdown`). Usa VITE_SUPPORT_WHATSAPP do .env.
 */
export function SupportWhatsappButton() {
    const href = getSupportWhatsappHref();
    if (!href) return null;

    return (
        // À esquerda: no canto direito o FAB cobria eventos da Agenda (semana/dia).
        // pointer-events-none no wrapper: só o link recebe clique.
        <div className="pointer-events-none group fixed bottom-5 left-5 z-40 flex flex-col items-start gap-3">
            <div className="relative translate-y-1 rounded-2xl border border-border bg-card px-4 py-3 opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="text-sm font-medium whitespace-nowrap text-foreground">
                    Dúvidas? Fale com nosso suporte
                </span>
                <div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-r border-b border-border bg-card" />
            </div>

            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com o suporte no WhatsApp"
                className="pointer-events-auto flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
            >
                <MessageCircle className="h-7 w-7" fill="currentColor" />
            </a>
        </div>
    );
}
