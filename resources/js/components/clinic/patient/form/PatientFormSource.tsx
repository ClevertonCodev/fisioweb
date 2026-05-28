import { Controller, type UseFormReturn } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = { form: UseFormReturn<PatientFormValues> };

export function PatientFormSource({ form }: Props) {
    const { control } = form;

    return (
        <div className="space-y-6">
            <h2 className="text-foreground text-lg font-semibold">Como me conheceu?</h2>
            <div>
                <Label className="text-muted-foreground text-xs">Tipo de indicação</Label>
                <Controller
                    name="referral_source"
                    control={control}
                    render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                                <SelectItem value="indicacao_amigo">Indicação de amigo</SelectItem>
                                <SelectItem value="indicacao_profissional">
                                    Indicação profissional
                                </SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
        </div>
    );
}
