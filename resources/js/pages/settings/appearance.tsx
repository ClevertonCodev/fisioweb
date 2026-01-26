import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { useActiveUrl } from '@/hooks/use-active-url';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import admin from '@/routes/admin';
import clinic from '@/routes/clinic';
import { type BreadcrumbItem } from '@/types';

export default function Appearance() {
    const { currentUrl } = useActiveUrl();

    const appearanceRoute = useMemo(() => {
        if (currentUrl.startsWith('/admin')) {
            return admin.settings.appearance.edit();
        }
        return clinic.settings.appearance.edit();
    }, [currentUrl]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Appearance settings',
            href: appearanceRoute.url,
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance Settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Appearance settings"
                        description="Update your account's appearance settings"
                    />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
