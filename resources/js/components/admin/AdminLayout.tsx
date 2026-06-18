import { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const isMobile = useIsMobile();

    return (
        <TooltipProvider>
            <div className="flex h-screen w-full bg-background">
                <AdminSidebar />
                <main
                    className={`min-h-0 flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}
                >
                    {children}
                </main>
            </div>
        </TooltipProvider>
    );
}
