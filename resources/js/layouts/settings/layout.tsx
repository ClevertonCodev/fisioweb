import { Link } from '@inertiajs/react';
import { type PropsWithChildren, useMemo } from 'react';

import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useActiveUrl } from '@/hooks/use-active-url';
import { cn, toUrl } from '@/lib/utils';
import admin from '@/routes/admin';
import clinic from '@/routes/clinic';
import { type NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { urlIsActive, currentUrl } = useActiveUrl();

    // Detectar qual área está sendo usada e obter as rotas corretas
    const routes = useMemo(() => {
        if (currentUrl.startsWith('/admin')) {
            return {
                profile: admin.settings.profile.edit(),
                password: admin.settings.password.edit(),
                twoFactor: admin.settings.twoFactor.show(),
                appearance: admin.settings.appearance.edit(),
            };
        }
        // Default para clinic
        return {
            profile: clinic.settings.profile.edit(),
            password: clinic.settings.password.edit(),
            twoFactor: clinic.settings.twoFactor.show(),
            appearance: clinic.settings.appearance.edit(),
        };
    }, [currentUrl]);

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Perfil',
            href: routes.profile.url,
            icon: null,
        },
        {
            title: 'Senha',
            href: routes.password.url,
            icon: null,
        },
        {
            title: 'Autenticação de Dois Fatores',
            href: routes.twoFactor.url,
            icon: null,
        },
        {
            title: 'Aparência',
            href: routes.appearance.url,
            icon: null,
        },
    ];

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-6">
            <Heading
                title="Configurações"
                description="Gerencie seu perfil e configurações da conta"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Configurações"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': urlIsActive(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
