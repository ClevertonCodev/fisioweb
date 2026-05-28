import { Controller, type UseFormReturn } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Props = { form: UseFormReturn<PatientFormValues> };

export function PatientFormInsurance({ form }: Props) {
    const { register, control, watch } = form;
    const hasInsurance = watch('has_insurance');

    return (
        <div className="space-y-6">
            <h2 className="text-foreground text-lg font-semibold">Convênio</h2>
            <Controller
                name="has_insurance"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-2">
                        <Switch
                            id="convenio"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="convenio" className="text-sm">
                            Com convênio
                        </Label>
                    </div>
                )}
            />
            {hasInsurance && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-muted-foreground text-xs" htmlFor="insurance">
                            Convênio
                        </Label>
                        <Input
                            id="insurance"
                            className="mt-1.5"
                            placeholder="Nome do convênio"
                            {...register('insurance')}
                        />
                    </div>
                    <div>
                        <Label className="text-muted-foreground text-xs" htmlFor="insurance_number">
                            Número do plano
                        </Label>
                        <Input
                            id="insurance_number"
                            className="mt-1.5"
                            placeholder="Número do plano"
                            {...register('insurance_number')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
