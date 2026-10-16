import { Moon, Sun } from 'lucide-react';

import { dsCn } from '../utils/ds-cn';

import { useDsTheme } from './useDsTheme';

export interface DsThemeToggleProps {
    className?: string;
}

export function DsThemeToggle({ className }: DsThemeToggleProps) {
    const { theme, toggleTheme } = useDsTheme();
    const isDark = theme === 'dark';
    const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={toggleTheme}
            className={dsCn(
                'inline-flex size-10 cursor-pointer items-center justify-center rounded-ds-md border border-ds-border-subtle bg-ds-surface-default font-ds text-ds-content-primary shadow-ds-xs transition-colors hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus focus-visible:outline-none',
                className,
            )}
        >
            {isDark ? (
                <Sun className="size-5" aria-hidden="true" />
            ) : (
                <Moon className="size-5" aria-hidden="true" />
            )}
        </button>
    );
}
