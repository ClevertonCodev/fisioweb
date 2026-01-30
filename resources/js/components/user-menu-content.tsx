import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import React from 'react';

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


    const getLogoutRoute = () => {
        if (currentUrl.startsWith('/admin')) {
            return admin.logout();
        }
        if (currentUrl.startsWith('/clinic')) {
            return clinic.logout();
        }
        return clinic.logout();
    };

    const getSettingsRoute = () => {
        if (currentUrl.startsWith('/admin')) {
            return admin.settings.profile.edit();
        }
        if (currentUrl.startsWith('/clinic')) {
            return clinic.settings.profile.edit();
        }
        return clinic.settings.profile.edit();
    };

    const logoutRoute = getLogoutRoute();
    const settingsRoute = getSettingsRoute();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        cleanup();
        router.post(logoutRoute.url, {}, {
            onFinish: () => {
                router.flushAll();
            },
        });
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
                <button
                    className="flex w-full items-center cursor-pointer"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Sair
                </button>
            </DropdownMenuItem>
        </>
    );
}
