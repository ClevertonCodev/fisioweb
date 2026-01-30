import { SidebarTrigger } from '@/components/ui/sidebar';

export function ClinicAppHeader() {
    return (
        <header className="flex h-12 shrink-0 items-center border-b border-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <SidebarTrigger className="-ml-1 h-8 w-8" />
        </header>
    );
}
