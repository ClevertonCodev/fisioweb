import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { DsButton, DsInput } from '@/components/ds';
import type { ServiceType, ServiceTypeDraft } from '@/domain/clinic';

/** Espelha a validação do backend (`PUT /clinic/service-types`). */
export const MAX_SERVICE_TYPES = 30;

const schema = z
    .object({
        items: z
            .array(
                z.object({
                    id: z.string().optional(),
                    name: z
                        .string()
                        .trim()
                        .min(1, 'Informe o nome')
                        .max(100, 'Use até 100 caracteres'),
                    durationMinutes: z
                        .number({ invalid_type_error: 'Informe a duração' })
                        .int('Use minutos inteiros')
                        .min(5, 'Mínimo de 5 min')
                        .max(480, 'Máximo de 480 min'),
                }),
            )
            .max(MAX_SERVICE_TYPES, `Até ${MAX_SERVICE_TYPES} tipos`),
    })
    .superRefine((v, ctx) => {
        const seen = new Set<string>();
        v.items.forEach((item, index) => {
            const key = item.name.trim().toLocaleLowerCase('pt-BR');
            if (!key) return;
            if (seen.has(key)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['items', index, 'name'],
                    message: 'Já existe um tipo com esse nome',
                });
            }
            seen.add(key);
        });
    });

type FormValues = z.input<typeof schema>;

interface ServiceTypeEditorProps {
    serviceTypes: ServiceType[];
    onSave: (items: ServiceTypeDraft[]) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

/**
 * Lista editável dos tipos de serviço da clínica (admin e secretária):
 * adicionar, renomear, mudar a duração, remover e reordenar. Salvar manda a
 * lista inteira.
 */
export function ServiceTypeEditor({
    serviceTypes,
    onSave,
    onCancel,
    isSaving,
}: ServiceTypeEditorProps) {
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            items: serviceTypes.map((t) => ({
                id: t.id,
                name: t.name,
                durationMinutes: t.durationMinutes,
            })),
        },
    });
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: 'items',
        keyName: 'key',
    });

    const submit = handleSubmit((values) =>
        onSave(
            values.items.map((item) => ({
                ...(item.id ? { id: item.id } : {}),
                name: item.name.trim(),
                durationMinutes: item.durationMinutes,
            })),
        ),
    );

    return (
        <div className="space-y-4 font-ds">
            <p className="text-ds-body-xs text-ds-content-secondary">
                Os tipos aparecem como atalhos ao agendar. Mudar ou apagar um
                tipo não altera as consultas que já existem.
            </p>

            {fields.length === 0 && (
                <p className="rounded-ds-md bg-ds-surface-subtle px-3 py-2.5 text-ds-body-sm text-ds-content-secondary">
                    Nenhum tipo cadastrado.
                </p>
            )}

            <ul className="space-y-3">
                {fields.map((field, index) => {
                    const itemErrors = errors.items?.[index];
                    return (
                        <li
                            key={field.key}
                            className="grid grid-cols-[1fr_96px_auto] items-start gap-2"
                        >
                            <DsInput
                                aria-label={`Nome do tipo ${index + 1}`}
                                placeholder="Nome"
                                size="sm"
                                {...register(`items.${index}.name`)}
                                state={itemErrors?.name ? 'error' : 'default'}
                                helper={itemErrors?.name?.message}
                            />
                            <DsInput
                                aria-label={`Duração do tipo ${index + 1} em minutos`}
                                type="number"
                                size="sm"
                                iconRight={
                                    <span className="text-ds-caption">min</span>
                                }
                                {...register(`items.${index}.durationMinutes`, {
                                    valueAsNumber: true,
                                })}
                                state={
                                    itemErrors?.durationMinutes
                                        ? 'error'
                                        : 'default'
                                }
                                helper={itemErrors?.durationMinutes?.message}
                            />
                            <div className="flex gap-0.5">
                                <DsButton
                                    variant="tertiary"
                                    size="sm"
                                    iconPosition="only"
                                    icon={<ArrowUp />}
                                    label="Subir"
                                    disabled={index === 0}
                                    onClick={() => move(index, index - 1)}
                                />
                                <DsButton
                                    variant="tertiary"
                                    size="sm"
                                    iconPosition="only"
                                    icon={<ArrowDown />}
                                    label="Descer"
                                    disabled={index === fields.length - 1}
                                    onClick={() => move(index, index + 1)}
                                />
                                <DsButton
                                    variant="destructive-tertiary"
                                    size="sm"
                                    iconPosition="only"
                                    icon={<Trash2 />}
                                    label="Remover"
                                    onClick={() => remove(index)}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            {errors.items?.root?.message && (
                <p className="text-ds-caption text-ds-content-danger">
                    {errors.items.root.message}
                </p>
            )}
            {errors.items?.message && (
                <p className="text-ds-caption text-ds-content-danger">
                    {errors.items.message}
                </p>
            )}

            <DsButton
                variant="secondary"
                size="sm"
                iconPosition="left"
                icon={<Plus />}
                label="Adicionar tipo"
                disabled={fields.length >= MAX_SERVICE_TYPES}
                onClick={() => append({ name: '', durationMinutes: 60 })}
            />

            <div className="flex justify-end gap-2 border-t border-ds-border-subtle pt-4">
                <DsButton
                    variant="secondary"
                    label="Voltar"
                    disabled={isSaving}
                    onClick={onCancel}
                />
                <DsButton
                    label="Salvar tipos"
                    loading={isSaving}
                    onClick={() => submit()}
                />
            </div>
        </div>
    );
}
