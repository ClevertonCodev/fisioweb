# React 19 Features (fisioweb)

Recursos novos do React 19 aplicáveis ao SPA. **O que ficou de fora:** Server Components, Server Actions (`'use server'`), `'use client'` — esses só fazem sentido em Next.js App Router; o fisioweb é Vite + SPA.

## Stack do projeto

- React 19.2 (client-only).
- React Router DOM v6.
- TanStack Query v5 — continua sendo a forma principal de lidar com mutations e cache. **`useActionState` não substitui** React Query no projeto; é uma alternativa para forms simples sem cache.

## `use()` — desempacotar promise/context na render

Substitui `useEffect + setState` para hidratar valor síncrono de uma promise ou context.

### Caso 1: ler context condicionalmente

Hoje, hooks não podem ser chamados condicionalmente. `use()` pode:

```tsx
import { use } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

function ConditionalUser({ showUser }: { showUser: boolean }) {
    if (!showUser) return null;
    const auth = use(AuthContext);   // ✅ legal dentro do if
    return <div>{auth.user?.name}</div>;
}
```

### Caso 2: desempacotar promise com Suspense

Útil quando a página recebe uma promise via `loader` do React Router e quer suspender até resolver. Hoje o projeto usa `await` no loader (mais simples). Use `use()` quando quer **streaming**: a página renderiza, e parte do conteúdo suspende esperando a promise.

```tsx
// route loader retorna promise não resolvida:
{
    path: 'pacientes/:id',
    loader: ({ params }) => ({
        patientPromise: findPatientById(Number(params.id!)), // sem await
    }),
    element: <PatientPage />,
}

// PatientPage.tsx
import { Suspense, use } from 'react';
import { useLoaderData } from 'react-router-dom';

function PatientHeader({ patientPromise }: { patientPromise: Promise<Patient | null> }) {
    const patient = use(patientPromise); // suspende até resolver
    return <h1>{patient?.name}</h1>;
}

export default function PatientPage() {
    const { patientPromise } = useLoaderData() as { patientPromise: Promise<Patient | null> };
    return (
        <Suspense fallback={<div>Carregando paciente…</div>}>
            <PatientHeader patientPromise={patientPromise} />
        </Suspense>
    );
}
```

**Use só quando faz sentido streaming**. Para fetch único + bloqueante, `await` no loader é mais simples.

## `useActionState` — form com loading/erro nativo

Alternativa ao React Hook Form **para forms sem React Query**. No fisioweb, padrão é RHF + Zod + `useMutation`; use `useActionState` quando:
- Form simples (1-3 campos).
- Sem necessidade de cache invalidation.
- Quer integração futura com Server Actions (não se aplica hoje).

```tsx
import { useActionState } from 'react';

type State =
    | { status: 'idle' }
    | { status: 'success'; data: { token: string } }
    | { status: 'error'; message: string };

async function loginAction(_prev: State, formData: FormData): Promise<State> {
    try {
        const { data } = await apiClient.post('/api/clinic/auth/login', {
            email: formData.get('email'),
            password: formData.get('password'),
        });
        return { status: 'success', data };
    } catch (err: unknown) {
        return { status: 'error', message: 'Credenciais inválidas' };
    }
}

export default function QuickLoginForm() {
    const [state, formAction, isPending] = useActionState<State, FormData>(
        loginAction,
        { status: 'idle' },
    );

    return (
        <form action={formAction} className="space-y-3">
            <Input name="email" type="email" required disabled={isPending} />
            <Input name="password" type="password" required disabled={isPending} />
            {state.status === 'error' && (
                <p className="text-destructive text-sm">{state.message}</p>
            )}
            <Button type="submit" disabled={isPending}>
                {isPending ? 'Entrando…' : 'Entrar'}
            </Button>
        </form>
    );
}
```

**Em forms maiores, mantenha RHF + Zod** — `useActionState` não traz schema, não traz `setError` por campo, e não invalida cache do React Query.

## `useFormStatus` — botão sabe se o pai está enviando

Componente filho lê estado de envio do `<form>` ancestral, sem prop drilling:

```tsx
import { useFormStatus } from 'react-dom';

function SubmitButton({ children }: { children: ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Salvando…' : children}
        </Button>
    );
}

// Uso dentro de form com action={...} (com useActionState ou direto):
<form action={someAction}>
    <Input name="x" />
    <SubmitButton>Salvar</SubmitButton>
</form>
```

Só funciona em form com prop `action`, não em form que usa `onSubmit` tradicional. Use junto com `useActionState`.

## `useOptimistic` — UI otimista

Cenário: usuário clica "Marcar como ativo", você quer mostrar resultado imediato e reverter se a API falhar.

```tsx
import { useOptimistic, useState } from 'react';
import { useUpdatePatientStatus } from '@/application/clinic';

interface Props { patient: Patient }

export function PatientStatusToggle({ patient }: Props) {
    const [optimisticStatus, setOptimisticStatus] = useOptimistic(
        patient.status,
        (_state, newStatus: 'active' | 'inactive') => newStatus,
    );

    const update = useUpdatePatientStatus(patient.id);

    const handleToggle = () => {
        const next = optimisticStatus === 'active' ? 'inactive' : 'active';
        // dispara otimista IMEDIATO
        setOptimisticStatus(next);
        // dispara real
        update.mutate({ status: next });
        // se falhar, React Query reverte; React reverte setOptimisticStatus no próximo commit
    };

    return (
        <Button onClick={handleToggle} disabled={update.isPending}>
            {optimisticStatus === 'active' ? 'Desativar' : 'Ativar'}
        </Button>
    );
}
```

**Alternativa via React Query** (sem `useOptimistic`) — `useMutation` com `onMutate` + `onError` (rollback):

```ts
useMutation({
    mutationFn: updateStatus,
    onMutate: async (newStatus) => {
        await queryClient.cancelQueries({ queryKey: ['clinic', 'patient', id] });
        const previous = queryClient.getQueryData(['clinic', 'patient', id]);
        queryClient.setQueryData(['clinic', 'patient', id], (old: Patient) => ({ ...old, status: newStatus }));
        return { previous };
    },
    onError: (_err, _vars, context) => {
        if (context) queryClient.setQueryData(['clinic', 'patient', id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['clinic', 'patient', id] }),
});
```

**Decisão:**
- UI otimista **dentro do componente** que age (toggle button) → `useOptimistic`.
- UI otimista **propagada** (atualizar lista + detalhe + contador) → React Query `onMutate`.

## Refs como prop (sem `forwardRef`)

React 19 permite passar `ref` como prop normal em function components:

```tsx
// antes (React 18) — precisava de forwardRef
const Input = forwardRef<HTMLInputElement, Props>(function Input(props, ref) {
    return <input ref={ref} {...props} />;
});

// React 19 — passe ref direto
function Input({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
    return <input ref={ref} {...props} />;
}
```

shadcn/ui já está com `forwardRef`. **Não troque** sem motivo — refator gratuito vira ruído. Use a forma nova apenas em componentes novos.

## Document metadata — title/meta no JSX

React 19 entende `<title>` e `<meta>` direto no JSX:

```tsx
export default function PatientPage() {
    return (
        <>
            <title>Pacientes — fisioweb</title>
            <meta name="description" content="Lista de pacientes da clínica" />
            <div>{/* página */}</div>
        </>
    );
}
```

No fisioweb hoje o `<title>` vem do `app.blade.php`. Mudar pra JSX é melhoria de DX, não urgência. Padronize **se** começar a usar — todas as pages ou nenhuma.

## `useDebugValue` — label custom em hooks complexos

Aparece nos React DevTools. Útil em hook de `application/`:

```tsx
import { useDebugValue, useQuery } from 'react';

export function usePatient(id: number | undefined) {
    const query = useQuery({/* ... */});
    useDebugValue(query.data ? `Patient ${query.data.id}` : 'loading');
    return query;
}
```

## O que **não usar** no projeto

- **`'use server'` / `'use client'`** — diretivas de RSC. Vite + SPA não tem RSC.
- **Server Actions** — só Next.js App Router.
- **`renderToReadableStream` / streaming SSR** — sem SSR no projeto.
- **`useFormState` (deprecado)** — usar `useActionState` (`useFormState` foi renomeado).

## Quick decision — React 19 vs padrão atual

| Cenário | Use |
|---------|-----|
| Form com cache invalidation | RHF + Zod + `useMutation` (mantém padrão) |
| Form simples sem cache (busca, login) | `useActionState` + `useFormStatus` |
| Botão "curtir" otimista local | `useOptimistic` |
| Mudança propagada otimista (lista + detalhe) | React Query `useMutation` com `onMutate` |
| Ler context condicional | `use(Context)` |
| Streaming de promise via loader | promise no loader + `<Suspense>` + `use(promise)` |
| Refs em componente novo | ref como prop direto (sem forwardRef) |
| Refs em componente shadcn | mantém `forwardRef` (consistência) |
| `<title>` por página | document metadata no JSX (se padronizar globalmente) |
