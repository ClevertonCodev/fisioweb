# Forms — React Hook Form + Zod (fisioweb)

Padrão obrigatório para forms novos. Algumas pages legadas (ex.: `FeatureNewPage`) usam `useState` puro — **não copie** esse padrão, use RHF + Zod.

## Stack

- `react-hook-form` — controle do form, validação, isPending.
- `zod` — schema de validação tipado, infere `type`.
- `@hookform/resolvers/zod` (se não estiver instalado: `npm i @hookform/resolvers`) — bridge.
- shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`.

## Schema Zod — espelhe o FormRequest do backend

Coloque em `application/<contexto>/<entity>-schema.ts` (espelha `application/admin/clinic-schema.ts` que já existe).

```ts
import { z } from 'zod';

export const agreementSchema = z.object({
    name: z.string().min(1, 'Nome obrigatório').max(255),
    status: z.enum(['active', 'inactive']),
    ownerId: z.number().nullable(),
    notes: z.string().nullable().optional(),
});

export type AgreementFormValues = z.infer<typeof agreementSchema>;
```

Mantém o **mesmo nome** das chaves do `WriteDto` em `application/<contexto>/ports.ts` para o submit virar 1:1.

## NewPage com RHF

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useCreateAgreement } from '@/application/clinic';
import { agreementSchema, type AgreementFormValues } from '@/application/clinic/agreement-schema';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function AgreementNewPage() {
    const navigate = useNavigate();

    const form = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            name: '',
            status: 'active',
            ownerId: null,
            notes: '',
        },
    });

    const createMutation = useCreateAgreement({
        onSuccess: () => navigate('/clinic/convenios'),
    });

    const onSubmit = (values: AgreementFormValues) => {
        createMutation.mutate(values);
    };

    return (
        <ClinicLayout>
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/clinic/convenios')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-foreground text-2xl font-semibold">Novo Convênio</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nome do convênio" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Ativo</SelectItem>
                                                        <SelectItem value="inactive">Inativo</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <hr className="border-border" />

                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate('/clinic/convenios')}
                                        disabled={createMutation.isPending}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </ClinicLayout>
    );
}
```

## EditPage — reset com dados do loader

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLoaderData, useNavigate } from 'react-router-dom';

import { useUpdateAgreement } from '@/application/clinic';
import { agreementSchema, type AgreementFormValues } from '@/application/clinic/agreement-schema';
import type { Agreement } from '@/domain/clinic';

export default function AgreementEditPage() {
    const navigate = useNavigate();
    const agreement = useLoaderData() as Agreement;

    const form = useForm<AgreementFormValues>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            name: agreement.name,
            status: agreement.status,
            ownerId: agreement.ownerId,
            notes: agreement.notes ?? '',
        },
    });

    // se o loader revalidar com dados novos, resetar form
    useEffect(() => {
        form.reset({
            name: agreement.name,
            status: agreement.status,
            ownerId: agreement.ownerId,
            notes: agreement.notes ?? '',
        });
    }, [agreement, form]);

    const updateMutation = useUpdateAgreement(agreement.id, {
        onSuccess: () => navigate('/clinic/convenios'),
    });

    const onSubmit = (values: AgreementFormValues) => updateMutation.mutate(values);

    return (
        /* mesma estrutura do New, só muda título e botão "Atualizar" */
    );
}
```

## Erros vindos do backend (422)

O backend retorna validação 422 com `{ message, errors: { campo: ['msg'] } }`. Para refletir nos campos do RHF:

```tsx
const updateMutation = useUpdateAgreement(id, {
    onSuccess: () => navigate('/clinic/convenios'),
});

// dentro do componente:
useEffect(() => {
    if (!updateMutation.error) return;
    const apiErrors =
        (updateMutation.error as { response?: { data?: { errors?: Record<string, string[]> } } })
            ?.response?.data?.errors;

    if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, msgs]) => {
            form.setError(field as keyof AgreementFormValues, { message: msgs[0] });
        });
    }
}, [updateMutation.error, form]);
```

(O hook `useUpdate*` já dispara `toast.error` no `onError`; este efeito adicional só popula os campos.)

## Padrões — checklist de form

- [ ] Schema Zod em `application/<ctx>/<entity>-schema.ts`, com mensagens em PT.
- [ ] `useForm<TFormValues>({ resolver: zodResolver(schema), defaultValues })`.
- [ ] Campos via `<FormField control={form.control} name="x" render={({ field }) => ...} />`.
- [ ] `<FormMessage />` mostra erro Zod ou erro injetado via `setError`.
- [ ] `<form onSubmit={form.handleSubmit(onSubmit)} ...>`.
- [ ] Submit button `type="submit"`, Cancel button `type="button"`.
- [ ] Botões desabilitados durante `mutation.isPending`.
- [ ] EditPage reseta form via `form.reset(...)` quando dados do loader mudam.
- [ ] Erros 422 do backend espelhados nos campos via `setError`.
- [ ] Nenhum `useState` para campos de form (todo estado vem do RHF).
- [ ] Submit envia `AgreementFormValues` (compatível com `AgreementWriteDto`).

## Quando NÃO usar RHF + Zod

- Form com **um único campo** e sem validação complexa (ex.: busca simples) — `useState` direto é aceitável.
- Filtros locais de DataTable — não é um form, é estado de UI.
- Quick action inline (modal de confirmar delete sem campos).

Para todo formulário com 2+ campos validados, **use RHF + Zod**.
