import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useActiveUrl } from '@/hooks/use-active-url';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import admin from '@/routes/admin';
import clinic from '@/routes/clinic';
import { type User } from '@/types';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { currentUrl } = useActiveUrl();

    // Obter a rota de logout correta baseado na área atual
    const getLogoutRoute = () => {
        if (currentUrl.startsWith('/admin')) {
            return admin.logout();
        }
        if (currentUrl.startsWith('/clinic')) {
            return clinic.logout();
        }
        // Fallback para clinic por padrão
        return clinic.logout();
    };

    // Obter a rota de settings correta baseado na área atual
    const getSettingsRoute = () => {
        if (currentUrl.startsWith('/admin')) {
            return admin.settings.profile.edit();
        }
        if (currentUrl.startsWith('/clinic')) {
            return clinic.settings.profile.edit();
        }
        // Fallback para clinic por padrão
        return clinic.settings.profile.edit();
    };

    const logoutRoute = getLogoutRoute();
    const settingsRoute = getSettingsRoute();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={settingsRoute.url}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Configurações
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logoutRoute.url}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Sair
                </Link>
            </DropdownMenuItem>
        </>
    );
}
