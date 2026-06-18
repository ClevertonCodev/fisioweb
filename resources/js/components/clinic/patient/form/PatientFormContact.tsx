import { Controller, type UseFormReturn } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';

import { FieldError, Req } from './shared';

type Props = { form: UseFormReturn<PatientFormValues> };

export function PatientFormContact({ form }: Props) {
    const {
        register,
        control,
        formState: { errors },
    } = form;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Contato</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label
                        className="text-xs text-muted-foreground"
                        htmlFor="phone"
                    >
                        Telefone
                        <Req />
                    </Label>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <PhoneInput
                                id="phone"
                                value={field.value}
                                onChange={field.onChange}
                                className="mt-1.5"
                            />
                        )}
                    />
                    <FieldError message={errors.phone?.message} />
                </div>
                <div>
                    <Label
                        className="text-xs text-muted-foreground"
                        htmlFor="email"
                    >
                        E-mail
                        <Req />
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        className="mt-1.5"
                        placeholder="email@exemplo.com"
                        {...register('email')}
                    />
                    <FieldError message={errors.email?.message} />
                </div>
            </div>
        </div>
    );
}
