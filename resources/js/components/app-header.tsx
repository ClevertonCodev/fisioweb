import { useActiveUrl } from '@/hooks/use-active-url';
import { type BreadcrumbItem } from '@/types';

import { AdminHeader } from './admin-header';
import { ClinicHeader } from './clinic-header';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const { currentUrl } = useActiveUrl();

    if (currentUrl.startsWith('/admin')) {
        return <AdminHeader breadcrumbs={breadcrumbs} />;
    }
    return <ClinicHeader breadcrumbs={breadcrumbs} />;
}
