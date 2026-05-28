import { ArrowLeft, Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateFeature, useFeatureCreateOptions } from '@/application/admin';
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

export default function FeatureNewPage() {
    const navigate = useNavigate();
    const { data: options, isLoading: optionsLoading } = useFeatureCreateOptions();

    const availableKeys = options?.available_keys ?? {};
    const allowedKeys = options?.allowed_keys ?? {};
    const types = options?.types ?? {};
    const noKeysAvailable = Object.keys(availableKeys).length === 0;

    const [form, setForm] = useState({
        key: '',
        name: '',
        valueIsolated: 0,
        type: '',
    });

    const handleKeySelect = (key: string) => {
        setForm((prev) => ({
            ...prev,
            key,
            name: allowedKeys[key] && !prev.name ? allowedKeys[key] : prev.name,
        }));
    };

    const createMutation = useCreateFeature({
        onSuccess: () => navigate('/admin/funcionalidades'),
    });

    const handleSave = () => {
        createMutation.mutate({
            key: form.key,
            name: form.name,
            valueIsolated: form.valueIsolated === 0 ? null : form.valueIsolated,
            type: form.type,
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                <div className="text-muted-foreground text-sm">
                    <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate('/admin/funcionalidades')}
                    >
                        Funcionalidades
                    </span>
                    {' > '}
                    <span className="text-foreground">Nova Funcionalidade</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/funcionalidades')}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-foreground text-2xl font-semibold">Nova Funcionalidade</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        {optionsLoading ? (
                            <p className="text-muted-foreground">Carregando opções...</p>
                        ) : noKeysAvailable ? (
                            <div className="space-y-4">
                                <div className="text-muted-foreground flex items-start gap-3">
                                    <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <p>
                                        Todas as funcionalidades permitidas já foram cadastradas. No
                                        momento só é possível cadastrar funcionalidades definidas no
                                        sistema (constantes).
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/admin/funcionalidades')}
                                >
                                    Voltar à lista
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>
                                            Funcionalidade{' '}
                                            <span className="text-destructive">*</span>
                                        </Label>
                                        <Select value={form.key} onValueChange={handleKeySelect}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a funcionalidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(availableKeys).map(
                                                    ([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            {String(label)}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground text-xs">
                                            Apenas funcionalidades definidas no sistema podem ser
                                            cadastradas.
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
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Valor Isolado</Label>
                                        <MoneyInput
                                            value={form.valueIsolated}
                                            onChange={(v) =>
                                                setForm((prev) => ({ ...prev, valueIsolated: v }))
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
                                                {Object.entries(types).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {String(label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <hr className="border-border" />

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/admin/funcionalidades')}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={
                                            !form.key ||
                                            !form.name ||
                                            !form.type ||
                                            createMutation.isPending
                                        }
                                    >
                                        Salvar Funcionalidade
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
