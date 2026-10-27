import { ArrowUp, Headset } from 'lucide-react';
import {
    useLayoutEffect,
    useState,
    type KeyboardEvent,
    type ReactNode,
} from 'react';

import { AppLogo } from '@/components/AppLogo';
import { DsCard, dsCn, DsInput, type InputProps } from '@/components/ds';

/**
 * As telas de fora do sistema são sempre claras: o tema é escolha de quem
 * já entrou. Ao sair delas volta o tema que estava, sem mexer no salvo.
 */
function useLightTheme() {
    useLayoutEffect(() => {
        const html = document.documentElement;
        const previous = html.dataset.theme;
        html.dataset.theme = 'light';
        return () => {
            if (previous) html.dataset.theme = previous;
            else delete html.dataset.theme;
        };
    }, []);
}

/**
 * Cartão no centro com a marca em cima (login, recuperar e redefinir senha).
 * A tela rola sozinha (html e body têm overflow: hidden); o "-safe"
 * centraliza quando cabe e encosta no topo quando não cabe, e os filhos não
 * encolhem (o cartão cortaria o fim).
 */
export function AuthLayout({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    useLightTheme();
    return (
        <div className="relative isolate flex h-full flex-col items-center justify-center-safe overflow-x-hidden overflow-y-auto bg-ds-surface-body px-4 py-12 font-ds text-ds-content-primary [&>*]:shrink-0">
            {/* Brilhos do fundo numa camada que corta a sobra: fora dela eles
                aumentariam a área de rolagem. */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
                <div className="absolute -top-40 -left-40 size-[28rem] rounded-ds-full bg-ds-primary-20 opacity-70 blur-3xl" />
                <div className="absolute -right-48 -bottom-48 size-[32rem] rounded-ds-full bg-ds-primary-30 opacity-50 blur-3xl" />
            </div>
            <div className="flex w-full max-w-[420px] flex-col gap-6">
                <div className="flex items-center justify-center gap-3">
                    <AppLogo className="size-14" />
                    <div className="flex flex-col leading-tight">
                        <span className="text-[1.75rem] font-semibold tracking-tight">
                            IVS
                        </span>
                        <span className="text-ds-caption text-ds-content-muted">
                            Fisioterapia e Saúde
                        </span>
                    </div>
                </div>
                <DsCard className="shadow-ds-md sm:p-3">
                    <div className="flex flex-col gap-6">
                        <header className="text-center">
                            <h1 className="text-ds-body-lg font-semibold text-ds-content-primary">
                                {title}
                            </h1>
                            <p className="mt-1 text-ds-body-xs text-ds-content-secondary">
                                {subtitle}
                            </p>
                        </header>
                        {children}
                    </div>
                </DsCard>
                {footer}
                <SupportLink />
            </div>
        </div>
    );
}

/** Link de texto na cor da marca (ex.: "Esqueci minha senha"). */
export function TextLink({
    onClick,
    children,
    className,
}: {
    onClick: () => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={dsCn(
                'cursor-pointer font-medium text-ds-content-brand outline-0 hover:underline focus-visible:shadow-ds-focus',
                className,
            )}
        >
            {children}
        </button>
    );
}

function SupportLink() {
    const whatsapp = import.meta.env.VITE_SUPPORT_WHATSAPP as
        | string
        | undefined;
    if (!whatsapp) return null;
    return (
        <p className="flex items-center justify-center gap-1.5 text-ds-caption text-ds-content-muted [&_svg]:size-3.5">
            <Headset />
            Precisa de ajuda?
            <TextLink
                onClick={() =>
                    window.open(
                        `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
                        '_blank',
                        'noopener,noreferrer',
                    )
                }
            >
                Falar com o suporte
            </TextLink>
        </p>
    );
}

/** Senha com o aviso de Caps Lock ligado. */
export function PasswordInput({
    onKeyDown,
    onKeyUp,
    ...props
}: Omit<InputProps, 'type'>) {
    const [capsLock, setCapsLock] = useState(false);
    const check = (e: KeyboardEvent<HTMLInputElement>) =>
        setCapsLock(e.getModifierState('CapsLock'));
    return (
        <div className="flex flex-col gap-1.5">
            <DsInput
                type="password"
                onKeyDown={(e) => {
                    check(e);
                    onKeyDown?.(e);
                }}
                onKeyUp={(e) => {
                    check(e);
                    onKeyUp?.(e);
                }}
                {...props}
            />
            {capsLock && (
                <span
                    role="status"
                    className="flex items-center gap-1.5 text-ds-caption font-medium text-ds-status-warning-content [&_svg]:size-3.5"
                >
                    <ArrowUp />
                    Caps Lock está ligado
                </span>
            )}
        </div>
    );
}
