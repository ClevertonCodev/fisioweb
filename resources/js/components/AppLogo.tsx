import { cn } from '@/lib/utils';

interface AppLogoProps {
    className?: string;
    /** `inverse` deixa o traço escuro branco, para fundos escuros. */
    tone?: 'default' | 'inverse';
}

/**
 * Marca do sistema. O traço escuro usa `currentColor` para acompanhar o tema
 * (ex.: `ds-dark:text-ds-white`); o azul é fixo. Versão estática em
 * `public/logo.svg`.
 */
export function AppLogo({ className, tone = 'default' }: AppLogoProps) {
    return (
        <svg
            viewBox="16 16 688 688"
            fill="none"
            strokeWidth={52}
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
                'shrink-0',
                tone === 'inverse' ? 'text-white' : 'text-[#15183D]',
                className,
            )}
        >
            <path
                stroke="currentColor"
                d="M44 151.1A60 60 0 0 1 130.8 97.4L508 286L130.8 474.6A60 60 0 0 1 44 420.9Z"
            />
            <path
                stroke="#5068A8"
                d="M676 568.9A60 60 0 0 1 589.2 622.6L297.9 476.9A48 48 0 0 1 297.9 391.1L589.2 245.4A60 60 0 0 1 676 299.1Z"
            />
        </svg>
    );
}
