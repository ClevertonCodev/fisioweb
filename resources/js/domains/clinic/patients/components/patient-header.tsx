import { Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/formatters';
import type { Patient } from '@/types';

interface PatientHeaderProps {
    patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
    return (
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center gap-4 px-6 py-4">
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                    <Link href="/clinic/patients">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>

                <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                        {getInitials(patient.name)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate text-lg font-semibold text-foreground">{patient.name}</h1>
                        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link href={`/clinic/patients/${patient.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                        {patient.cpf ? `CPF: ${patient.cpf}` : (patient.profession ?? '—')}
                    </p>
                </div>
            </div>
        </header>
    );
}
