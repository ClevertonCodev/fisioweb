import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { billingTypes, useCreatePlan } from '@/application/admin';
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

export default function PlanNewPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        billingType: '' as '' | 'fixed' | 'per_user',
        monthlyValue: 0,
        annualValue: 0,
    });

    const createMutation = useCreatePlan({
        onSuccess: () => navigate('/admin/planos'),
    });

    const handleSave = () => {
        createMutation.mutate({
            name: form.name,
            billingType: form.billingType as 'fixed' | 'per_user',
            monthlyValue: form.monthlyValue,
            annualValue: form.annualValue,
        });
    };

    const isValid =
        form.name && form.billingType && form.monthlyValue >= 0 && form.annualValue >= 0;

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                <div className="text-muted-foreground text-sm">
                    <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate('/admin/planos')}
                    >
                        Planos
                    </span>
                    {' > '}
                    <span className="text-foreground">Novo Plano</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/planos')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-foreground text-2xl font-semibold">Novo Plano</h1>
                </div>

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
                                    onChange={(v) =>
                                        setForm((prev) => ({ ...prev, monthlyValue: v }))
                                    }
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
                                    onChange={(v) =>
                                        setForm((prev) => ({ ...prev, annualValue: v }))
                                    }
                                    name="annualValue"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <hr className="border-border" />

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => navigate('/admin/planos')}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!isValid || createMutation.isPending}
                            >
                                Salvar Plano
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
