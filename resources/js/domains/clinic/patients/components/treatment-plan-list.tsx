import { Link, router } from '@inertiajs/react';
import { Calendar, ClipboardList, FileText } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import type { Patient, TreatmentPlan } from '@/types';

import { PLAN_STATUS_COLORS, PLAN_STATUS_LABELS } from '../utils';

interface TreatmentPlanListProps {
    patient: Patient;
    treatmentPlans: TreatmentPlan[];
}

export function TreatmentPlanList({ patient, treatmentPlans }: TreatmentPlanListProps) {
    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Programas de tratamento</h2>
                <Button size="sm" asChild className="gap-2">
                    <Link href={`/clinic/treatment-plans/create?patient_id=${patient.id}`}>
                        <FileText className="h-4 w-4" />
                        Novo programa
                    </Link>
                </Button>
            </div>

            {treatmentPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhum programa de tratamento</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Crie o primeiro programa para este paciente.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {treatmentPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="cursor-pointer rounded-lg border border-border p-6 transition-colors hover:bg-muted/30"
                            onClick={() => router.visit(`/clinic/treatment-plans/${plan.id}`)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground">{plan.title}</p>
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${PLAN_STATUS_COLORS[plan.status] ?? ''}`}
                                        >
                                            {PLAN_STATUS_LABELS[plan.status] ?? plan.status}
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                        {plan.start_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(plan.start_date)}
                                                {plan.end_date && ` → ${formatDate(plan.end_date)}`}
                                            </span>
                                        )}
                                        {plan.physio_area && <span>{plan.physio_area.name}</span>}
                                        {plan.clinic_user && (
                                            <span className="flex items-center gap-1">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                                                        {plan.clinic_user.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {plan.clinic_user.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
