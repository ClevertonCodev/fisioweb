import { useActiveUrl } from '@/hooks/use-active-url';

import { AdminSidebar } from './admin-sidebar';
import { ClinicSidebar } from './clinic-sidebar';

export function AppSidebar() {
    const { currentUrl } = useActiveUrl();

    if (currentUrl.startsWith('/admin')) {
        return <AdminSidebar />;
    }

    return <ClinicSidebar />;
}
