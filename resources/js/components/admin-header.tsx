import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    Dumbbell,
    LayoutGrid,
    Menu,
    Settings,
    Sparkles,
    Video,
} from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useActiveUrl } from '@/hooks/use-active-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard as adminDashboard } from '@/routes/admin';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';

import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const activeItemStyles = 'text-neutral-900 bg-neutral-100';

interface AdminHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AdminHeader({ breadcrumbs = [] }: AdminHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { urlIsActive } = useActiveUrl();
    const dashboardRoute = adminDashboard();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardRoute,
            icon: LayoutGrid,
        },
        {
            title: 'Clinicas',
            href: '/admin/clinics',
            icon: Building2,
        },
    ];

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Menu de Navegação Admin
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                            {/* Dropdown Planos Mobile */}
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center space-x-2 font-medium">
                                                    <Sparkles className="h-5 w-5" />
                                                    <span>Planos</span>
                                                </div>
                                                <div className="ml-7 flex flex-col space-y-2">
                                                    <Link
                                                        href="/admin/functionalities"
                                                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Sparkles className="h-4 w-4" />
                                                        <span>Funcionalidades</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/plans"
                                                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        <LayoutGrid className="h-4 w-4" />
                                                        <span>Planos</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/plans/configure-features"
                                                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                        <span>
                                                            Configurar
                                                            Funcionalidades
                                                        </span>
                                                    </Link>
                                                </div>
                                            </div>
                                            {/* Dropdown Exercícios Mobile */}
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center space-x-2 font-medium">
                                                    <Dumbbell className="h-5 w-5" />
                                                    <span>Exercícios</span>
                                                </div>
                                                <div className="ml-7 flex flex-col space-y-2">
                                                    <Link
                                                        href="/admin/videos"
                                                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                        <span>Vídeos</span>
                                                    </Link>
                                                    <Link
                                                        href="/admin/exercises"
                                                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Dumbbell className="h-4 w-4" />
                                                        <span>Exercícios</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboardRoute}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                urlIsActive(item.href) &&
                                                activeItemStyles,
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {urlIsActive(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                                {/* Dropdown Planos */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            (urlIsActive('/admin/functionalities') ||
                                                urlIsActive('/admin/plans') ||
                                                urlIsActive(
                                                    '/admin/plans/configure-features',
                                                )) &&
                                            activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Planos
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-1">
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/functionalities"
                                                        className={cn(
                                                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                                            urlIsActive(
                                                                '/admin/functionalities',
                                                            ) && 'bg-accent',
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Sparkles className="h-4 w-4" />
                                                            <div className="text-sm font-medium leading-none">
                                                                Funcionalidades
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                            Gerencie as
                                                            funcionalidades
                                                            disponíveis
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/plans"
                                                        className={cn(
                                                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                                            urlIsActive(
                                                                '/admin/plans',
                                                            ) && 'bg-accent',
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <LayoutGrid className="h-4 w-4" />
                                                            <div className="text-sm font-medium leading-none">
                                                                Planos
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                            Gerencie os planos
                                                            disponíveis no
                                                            sistema
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/plans/configure-features"
                                                        className={cn(
                                                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                                            urlIsActive(
                                                                '/admin/plans/configure-features',
                                                            ) && 'bg-accent',
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Settings className="h-4 w-4" />
                                                            <div className="text-sm font-medium leading-none">
                                                                Configurar
                                                                Funcionalidades
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                            Configure as
                                                            funcionalidades para
                                                            cada plano
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                        </ul>
                                    </NavigationMenuContent>
                                    {(urlIsActive('/admin/functionalities') ||
                                        urlIsActive('/admin/plans') ||
                                        urlIsActive(
                                            '/admin/plans/configure-features',
                                        )) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                        )}
                                </NavigationMenuItem>
                                {/* Dropdown Exercícios */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            (urlIsActive('/admin/videos') ||
                                                urlIsActive(
                                                    '/admin/exercises',
                                                )) && activeItemStyles,
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        <Dumbbell className="mr-2 h-4 w-4" />
                                        Exercícios
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-1">
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/videos"
                                                        className={cn(
                                                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                                            urlIsActive(
                                                                '/admin/videos',
                                                            ) && 'bg-accent',
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Video className="h-4 w-4" />
                                                            <div className="text-sm font-medium leading-none">
                                                                Vídeos
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                            Gerencie os vídeos
                                                            do sistema
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                            <li>
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/admin/exercises"
                                                        className={cn(
                                                            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                                                            urlIsActive(
                                                                '/admin/exercises',
                                                            ) && 'bg-accent',
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <Dumbbell className="h-4 w-4" />
                                                            <div className="text-sm font-medium leading-none">
                                                                Exercícios
                                                            </div>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                            Gerencie os
                                                            exercícios do
                                                            sistema
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>
                                        </ul>
                                    </NavigationMenuContent>
                                    {(urlIsActive('/admin/videos') ||
                                        urlIsActive('/admin/exercises')) && (
                                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                    )}
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
