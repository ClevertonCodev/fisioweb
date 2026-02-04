/**
 * Header e menu hamburger para a área da clínica em viewports móveis.
 * Só é exibido em telas < md; no desktop o layout usa a sidebar fixa (ClinicSidebar).
 */
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Activity, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ClinicSidebar } from '@/components/clinic-sidebar';
import { dashboard as clinicDashboard } from '@/routes/clinic';

/** Cores alinhadas à sidebar (tema escuro + turquesa) */
const mobileHeaderStyles = {
    header: {
        backgroundColor: 'hsl(200 25% 18%)',
        borderColor: 'hsl(200 20% 25%)',
    },
    logoIcon: 'hsl(175 70% 45%)',
    text: 'hsl(180 10% 95%)',
} as const;

export function ClinicMobileHeader() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header
            className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden"
            style={{
                backgroundColor: mobileHeaderStyles.header.backgroundColor,
                borderColor: mobileHeaderStyles.header.borderColor,
            }}
        >
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-[hsl(180_10%_95%)] hover:bg-[hsl(200_20%_25%)] hover:text-[hsl(180_10%_95%)]"
                        aria-label="Abrir menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="flex h-full w-[min(18rem,85vw)] flex-col overflow-hidden border-r border-[hsl(200_20%_25%)] bg-[hsl(200_25%_18%)] p-0 text-[hsl(180_10%_95%)] [&>button.absolute]:text-[hsl(180_10%_95%)]"
                >
                    <SheetTitle className="sr-only">
                        Menu de navegação
                    </SheetTitle>
                    <ClinicSidebar
                        variant="drawer"
                        onNavigate={() => setMenuOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <Link
                href={clinicDashboard().url}
                prefetch
                className="flex items-center gap-2"
            >
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: mobileHeaderStyles.logoIcon }}
                >
                    <Activity className="h-5 w-5" />
                </div>
                <span
                    className="font-semibold"
                    style={{ color: mobileHeaderStyles.text }}
                >
                    FisioElite
                </span>
            </Link>
        </header>
    );
}
