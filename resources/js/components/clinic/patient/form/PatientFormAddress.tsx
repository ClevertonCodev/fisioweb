import { useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import type { PatientFormValues } from '@/application/clinic';
import { useCepLookup } from '@/application/clinic/use-cep-lookup';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = { form: UseFormReturn<PatientFormValues> };

export function PatientFormAddress({ form }: Props) {
    const { register, control, setValue, watch } = form;
    const zipCode = watch('zip_code');
    const noNumber = watch('address_no_number');
    const { loading, lookup } = useCepLookup();

    useEffect(() => {
        lookup(zipCode).then((result) => {
            if (!result) return;
            setValue('address_street', result.street, { shouldValidate: false });
            setValue('neighborhood', result.neighborhood, { shouldValidate: false });
            setValue('city', result.city, { shouldValidate: false });
            setValue('state', result.state, { shouldValidate: false });
        });
    }, [zipCode, setValue, lookup]);

    return (
        <div className="space-y-6">
            <h2 className="text-foreground text-lg font-semibold">Endereço</h2>

            <Controller
                name="zip_code"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-4">
                        <div className="w-64">
                            <Label className="text-muted-foreground text-xs" htmlFor="zip_code">
                                CEP
                            </Label>
                            <Input
                                id="zip_code"
                                className="mt-1.5"
                                placeholder="00000-000"
                                {...field}
                            />
                        </div>
                        {loading && (
                            <span className="text-muted-foreground mt-5 text-sm">Buscando...</span>
                        )}
                    </div>
                )}
            />

            <div>
                <Label className="text-muted-foreground text-xs" htmlFor="address_street">
                    Rua/Avenida
                </Label>
                <Input
                    id="address_street"
                    className="mt-1.5"
                    placeholder="Rua/Avenida"
                    {...register('address_street')}
                />
            </div>

            <div className="flex items-end gap-4">
                <div className="w-32">
                    <Label className="text-muted-foreground text-xs" htmlFor="address_number">
                        Número
                    </Label>
                    <Input
                        id="address_number"
                        className="mt-1.5"
                        placeholder="Nº"
                        disabled={noNumber}
                        {...register('address_number')}
                    />
                </div>
                <Controller
                    name="address_no_number"
                    control={control}
                    render={({ field }) => (
                        <div className="mb-1.5 flex items-center gap-2">
                            <Checkbox
                                id="sem-numero"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            <Label htmlFor="sem-numero" className="text-xs">
                                Sem número
                            </Label>
                        </div>
                    )}
                />
            </div>

            <div>
                <Label className="text-muted-foreground text-xs" htmlFor="address_complement">
                    Complemento
                </Label>
                <Input
                    id="address_complement"
                    className="mt-1.5"
                    placeholder="Complemento (opcional)"
                    {...register('address_complement')}
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label className="text-muted-foreground text-xs" htmlFor="neighborhood">
                        Bairro
                    </Label>
                    <Input
                        id="neighborhood"
                        className="mt-1.5"
                        placeholder="Bairro"
                        {...register('neighborhood')}
                    />
                </div>
                <div>
                    <Label className="text-muted-foreground text-xs" htmlFor="city">
                        Cidade
                    </Label>
                    <Input
                        id="city"
                        className="mt-1.5"
                        placeholder="Cidade"
                        {...register('city')}
                    />
                </div>
                <div>
                    <Label className="text-muted-foreground text-xs" htmlFor="state">
                        Estado (UF)
                    </Label>
                    <Input
                        id="state"
                        className="mt-1.5"
                        placeholder="UF"
                        maxLength={2}
                        {...register('state')}
                    />
                </div>
            </div>
        </div>
    );
}
