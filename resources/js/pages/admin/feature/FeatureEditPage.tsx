import { useState } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';

import { featureTypes, useUpdateFeature } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BackButton } from '@/components/ui/back-button';
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
import type { Feature } from '@/domain/admin';

function getFormInitialState(feature: Feature) {
    return {
        key: feature.key,
        name: feature.name,
        valueIsolated: feature.valueIsolated ?? 0,
        type: feature.type ?? '',
    };
}

function EditFeatureForm({
    feature,
    featureId,
    onSuccess,
}: {
    feature: Feature;
    featureId: number;
    onSuccess: () => void;
}) {
    const navigate = useNavigate();
    const [form, setForm] = useState(() => getFormInitialState(feature));
    const updateMutation = useUpdateFeature(featureId, { onSuccess });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({
            key: form.key,
            name: form.name,
            valueIsolated: form.valueIsolated === 0 ? null : form.valueIsolated,
            type: form.type,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Chave (key)</Label>
                            <Input
                                value={form.key}
                                disabled
                                className="bg-muted/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                A chave não pode ser alterada.
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Nome <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="Nome da funcionalidade"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Valor Isolado</Label>
                            <MoneyInput
                                value={form.valueIsolated}
                                onChange={(v) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        valueIsolated: v,
                                    }))
                                }
                                name="valueIsolated"
                                placeholder="0,00"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                Tipo <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm((prev) => ({ ...prev, type: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {featureTypes.map((t) => (
                                        <SelectItem
                                            key={t.value}
                                            value={t.value}
                                        >
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <hr className="border-border" />

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/admin/funcionalidades')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !form.name ||
                                !form.type ||
                                updateMutation.isPending
                            }
                        >
                            Salvar alterações
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

/** Conteúdo da página: só monta quando a API já retornou e temos `feature`. */
function EditFeaturePageContent({
    feature,
    featureId,
}: {
    feature: Feature;
    featureId: number;
}) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="text-sm text-muted-foreground">
                <span
                    className="cursor-pointer hover:underline"
                    onClick={() => navigate('/admin/funcionalidades')}
                >
                    Funcionalidades
                </span>
                {' > '}
                <span className="text-foreground">Editar Funcionalidade</span>
            </div>

            <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                    Editar Funcionalidade
                </h1>
                <BackButton to="/admin/funcionalidades" />
            </div>

            <EditFeatureForm
                key={feature.id}
                feature={feature}
                featureId={featureId}
                onSuccess={() => navigate('/admin/funcionalidades')}
            />
        </div>
    );
}

export default function FeatureEditPage() {
    const { id } = useParams<{ id: string }>();
    const feature = useLoaderData() as Feature;
    const featureId = parseInt(id!, 10);

    return (
        <AdminLayout>
            <EditFeaturePageContent feature={feature} featureId={featureId} />
        </AdminLayout>
    );
}
