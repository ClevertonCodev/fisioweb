import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';

import { billingTypes, useUpdatePlan } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Plan } from '@/domain/admin';

function getFormInitialState(plan: Plan) {
    return {
        name: plan.name,
        billingType: plan.billingType,
        monthlyValue: plan.monthlyValue,
        annualValue: plan.annualValue,
    };
}

function EditPlanForm({
    plan,
    planId,
    onSuccess,
}: {
    plan: Plan;
    planId: number;
    onSuccess: () => void;
}) {
    const navigate = useNavigate();
    const [form, setForm] = useState(() => getFormInitialState(plan));
    const updateMutation = useUpdatePlan(planId, { onSuccess });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({
            name: form.name,
            billingType: form.billingType,
            monthlyValue: form.monthlyValue,
            annualValue: form.annualValue,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>
                                Nome do Plano <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="Digite o nome do plano"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Tipo de Cobrança <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.billingType}
                                onValueChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        billingType: v as 'fixed' | 'per_user',
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {billingTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Valor Mensal <span className="text-destructive">*</span>
                            </Label>
                            <MoneyInput
                                value={form.monthlyValue}
                                onChange={(v) => setForm((prev) => ({ ...prev, monthlyValue: v }))}
                                name="monthlyValue"
                                placeholder="0,00"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Valor Anual <span className="text-destructive">*</span>
                            </Label>
                            <MoneyInput
                                value={form.annualValue}
                                onChange={(v) => setForm((prev) => ({ ...prev, annualValue: v }))}
                                name="annualValue"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <hr className="border-border" />

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/admin/planos')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!form.name || !form.billingType || updateMutation.isPending}
                        >
                            Salvar alterações
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

function PlanEditPageContent({ plan, planId }: { plan: Plan; planId: number }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="text-muted-foreground text-sm">
                <span
                    className="cursor-pointer hover:underline"
                    onClick={() => navigate('/admin/planos')}
                >
                    Planos
                </span>
                {' > '}
                <span className="text-foreground">Editar Plano</span>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/planos')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-foreground text-2xl font-semibold">Editar Plano</h1>
            </div>

            <EditPlanForm
                key={plan.id}
                plan={plan}
                planId={planId}
                onSuccess={() => navigate('/admin/planos')}
            />
        </div>
    );
}

export default function PlanEditPage() {
    const { id } = useParams<{ id: string }>();
    const plan = useLoaderData() as Plan;
    const planId = parseInt(id!, 10);

    return (
        <AdminLayout>
            <PlanEditPageContent plan={plan} planId={planId} />
        </AdminLayout>
    );
}
