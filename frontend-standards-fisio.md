# Frontend Standards - Clinic App (React SPA + React Router + React Query + TypeScript)

> Guia prático para manter o frontend escalável no contexto real deste projeto.
> Data: 2026-02-28 · Atualizado: 2026-02-28 (DDD raiz aplicado no módulo feature)

---

## 1. Objetivo

Padronizar decisões de frontend para:

- reduzir acoplamento entre telas
- manter tipagem previsível
- preservar UX (loading, erro, navegação)
- facilitar evolução por contexto (`admin`, `clinic`)

Este documento reflete o estado atual da base em `resources/js`.

---

## 2. Stack oficial do projeto

- React 19
- React Router (`createBrowserRouter`)
- TanStack React Query
- Axios (`apiClient` com interceptors de auth/refresh)
- TypeScript
- shadcn/ui + Tailwind CSS

Regra prática:

- roteamento e layout global: `react-router-dom`
- estado de servidor: `@tanstack/react-query`
- HTTP: `@/infrastructure/api/client` (não usar `fetch` direto)

---

## 3. Princípios arquiteturais

### 3.1 O que fica no frontend

- renderização de interface
- estado de interação (filtro local, modal, paginação local)
- orquestração de navegação
- feedback visual (loading, erro, sucesso)

### 3.2 O que não fica no frontend

- regra de negócio crítica
- autorização efetiva
- validação de segurança

### 3.3 Backend como fonte de verdade

- validações finais em `FormRequest`
- regras de negócio em `Services`
- permissões sempre validadas no backend

---

## 4. Estrutura oficial (estado atual)

```txt
resources/js/
  pages/
    admin/
      feature/
      exercises/
    clinic/

  components/
    ui/
    admin/
    clinic/

  application/
    admin/
    clinic/

  domain/
    admin/
    clinic/
    auth/

  infrastructure/
    api/
    repositories/

  contexts/
  hooks/
  lib/
```

Responsabilidade por camada:

- `pages/`: composição de tela e fluxo
- `components/`: blocos visuais reutilizáveis
- `application/`: hooks de caso de uso (query/mutation) + funções de use-case puras + DTOs de escrita + constantes de UI
- `domain/`: **somente** entidades de negócio puras (camelCase, sem campos de infra)
- `infrastructure/`: cliente HTTP, DTOs da API, mappers, repositórios concretos
- `lib/`: utilitários puros

---

## 5. Convenções de nomes e arquivos

### 5.1 Convenção vigente

- Componentes e páginas React: `PascalCase.tsx`
- Hooks e arquivos utilitários: `kebab-case.ts` (ex.: `use-features.ts`)
- Pastas de recurso admin: `pages/admin/<recurso>/` com `EntityListPage.tsx`, `EntityNewPage.tsx`, `EntityEditPage.tsx`

### 5.2 Regra de consistência

Dentro de uma mesma feature, manter um único padrão de nomes. Evitar mistura de convenções no mesmo diretório.

---

## 6. Padrão de implementação por camada

### 6.1 Pages

Responsabilidades:

- compor layout (`AdminLayout`, `ClinicLayout`)
- coordenar estado de UI
- conectar hooks de `application/`
- delegar blocos densos para componentes

Não colocar em page:

- parsing de payload de API
- detalhes de autenticação/token
- regra de negócio crítica
- importar repositório de `infrastructure/` diretamente

### 6.2 Application — hooks, use-cases e constantes de UI

Responsabilidades:

- encapsular `useQuery`/`useMutation` (hooks)
- centralizar `queryKey`
- configurar `enabled`, `staleTime` quando necessário
- exportar funções de use-case puras (não-hook) para uso em loaders do React Router
- hospedar DTOs de escrita (`XxxWriteDto`) — são concerns de aplicação, não de domínio
- hospedar constantes de label de UI (ex.: `featureTypes`) — não pertencem ao domain

Regra:

- query de servidor deve nascer em `application/`, não inline em múltiplas pages
- loaders do React Router devem chamar funções de `application/`, nunca repositórios de `infrastructure/` diretamente

```typescript
// ✅ CORRETO — use-case pura exportada para uso em loaders
// application/admin/use-features.ts
export function listFeatures(params?) {
    return apiFeaturesRepository.list(params);
}

// ✅ CORRETO — loader chama application layer
// App.tsx
import { listFeatures } from '@/application/admin';
loader: async () => {
    const features = await listFeatures();
    return { features, error: null };
}

// ❌ PROIBIDO — loader chama infra diretamente
import { apiFeaturesRepository } from '@/infrastructure/repositories';
loader: async () => apiFeaturesRepository.list() // PROIBIDO
```

### 6.3 Domain — entidade pura (DDD)

A camada de domínio contém **exclusivamente** entidades de negócio. Nada mais.

**O que pertence ao domain:**
- interfaces de entidade com campos de negócio em **camelCase**
- union types de valores de domínio (`'bool' | 'int'`, `'active' | 'inactive'`)

**O que NÃO pertence ao domain:**
- `created_at`, `updated_at` — concerns de infraestrutura
- shapes de resposta da API (`ApiFeatureResponse`, `ApiFeatureListPage`) — pertencem à infra
- DTOs de escrita (`FeaturePayload`, `CreateDto`) — pertencem à camada de aplicação
- constantes de label de UI (`featureTypes`, `billingTypes`, `STATUS_COLORS`) — pertencem à apresentação/aplicação
- campos em `snake_case` espelhando o banco — o mapeamento é responsabilidade da infra

```typescript
// ✅ CORRETO — entidade pura, camelCase, sem infra
// domain/admin/feature.ts
export type FeatureType = 'bool' | 'int';

export interface Feature {
    id: number;
    key: string;
    name: string;
    valueIsolated: number | null; // camelCase, não value_isolated
    type: FeatureType;            // union type, não string
}
// Sem: created_at, updated_at, ApiFeatureResponse, FeaturePayload, featureTypes

// ❌ ERRADO — domain espelhando API
export interface Feature {
    value_isolated: number | null; // snake_case = concern de banco/API
    type: string;                  // sem type union
    created_at: string;            // concern de infra
}

// ❌ ERRADO — constante de UI no domain
export const featureTypes = [
    { value: 'bool', label: 'Ativa/Inativa' }, // pertence à application/
];
```

### 6.4 Infrastructure repositories — DTOs tipados + mappers

Responsabilidades:

- definir interfaces internas de DTO da API (privadas ao arquivo do repositório)
- implementar mappers explícitos: `toEntity()` (API DTO → Domain) e `toApiPayload()` (Domain Write DTO → API)
- chamar endpoints via `apiClient`
- esconder detalhes de transporte da UI

Regra:

- sempre retornar shape estável e tipado (tipo de domínio)
- os campos snake_case da API ficam **dentro** do repositório, nunca vazam para fora

```typescript
// ✅ CORRETO — DTOs internos + mappers explícitos
// infrastructure/repositories/api-admin-features.ts

/** DTO interno — shape da API (privado ao arquivo) */
interface ApiFeatureDto {
    id: number;
    value_isolated: number | null; // snake_case fica aqui
    created_at: string;            // timestamps ficam aqui
    updated_at: string;
}

/** Mapper: API DTO → Domain Entity */
function toFeature(raw: ApiFeatureDto): Feature {
    return {
        id: raw.id,
        valueIsolated: raw.value_isolated != null ? Number(raw.value_isolated) : null,
        type: raw.type as FeatureType,
        // created_at e updated_at descartados — não são domínio
    };
}

/** Mapper: Domain Write DTO → API payload (camelCase → snake_case) */
function toApiPayload(dto: FeatureWriteDto): Record<string, unknown> {
    return {
        value_isolated: dto.valueIsolated, // converte de volta para snake_case
        type: dto.type,
    };
}
```

---

## 7. Dados de servidor (React Query)

### 7.1 Queries

- usar `useQuery` para leitura
- `queryKey` determinística e estável
- evitar duplicação de query da mesma entidade em páginas diferentes

### 7.2 Mutations

- usar `useMutation`
- invalidar chaves relacionadas no `onSuccess`
- tratar erro com mensagem amigável (`toast.error`)

### 7.3 Loader do React Router

`loader` é permitido para pré-carregamento de rota, mas o padrão preferencial para estado contínuo de dados é React Query.

Se usar loader:

- o loader **deve** chamar uma função da camada `application/`, nunca um repositório de `infrastructure/` diretamente
- se combinado com mutation na mesma feature: manter invalidação/revalidação explícita

---

## 8. HTTP e autenticação

- usar somente `apiClient` (`@/infrastructure/api/client`)
- não usar `fetch` manual em páginas/componentes
- não duplicar lógica de `Authorization`, refresh token ou redirect

Motivo: interceptors já implementam cabeçalhos, refresh e fallback de sessão.

---

## 9. TypeScript

Estado atual do projeto:

- `strict: false`
- `noImplicitAny: false`

Padrão obrigatório no código novo:

- não introduzir `any e unknown` sem justificativa
- tipar props de componentes e retorno de hooks
- tipar payload/response de repositórios
- manter entidades de negócio puras em `domain/` (camelCase, sem campos de infra)
- usar union types explícitos (`'bool' | 'int'`) em vez de `string` para campos com valores fixos
- campos em camelCase no domain — snake_case só nos DTOs internos da infra

Meta incremental:

- reduzir `any` existente
- preparar base para ativar regras mais rígidas por etapa

---

## 10. UI/UX padrão

### 10.1 Estados obrigatórios em listagem

Toda listagem precisa cobrir:

1. loading
2. vazio
3. erro

### 10.2 Formulários

- bloquear ação durante envio (`isPending`/`isLoading`)
- exibir erro de API com contexto
- evitar submit duplicado
- manter botão de cancelar/voltar claro

### 10.3 Data table

Ao usar `DataTable`:

- definir `columns` fora do JSX principal
- paginação controlada por estado explícito
- total e vazio sempre informados (`totalCount`, `emptyMessage`)

### 10.4 Diálogos e confirmações

| Situação | Componente |
|----------|-----------|
| Confirmação de ação destrutiva (excluir, remover) | `AlertDialog` (`components/ui/alert-dialog`) |
| Formulário em overlay (criar, editar sem sair da tela) | `Dialog` (`components/ui/dialog`) |
| Notificações de resultado (sucesso, erro) | `toast` via `sonner` |

**Nunca usar `confirm()` nativo do browser** — quebra o padrão visual e não é customizável.

Padrão para confirmação destrutiva:

```tsx
// estado local na página
const [itemToDelete, setItemToDelete] = useState<MyEntity | null>(null);

// no dropdown/botão
<DropdownMenuItem onClick={() => setItemToDelete(item)}>Excluir</DropdownMenuItem>

// fora do JSX principal (antes de fechar o componente)
<AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Excluir {itemToDelete?.name}</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { if (itemToDelete) deleteMutation.mutate(itemToDelete.id); setItemToDelete(null); }}
            >
                Excluir
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

---

## 11. Performance e legibilidade

- evitar transformações pesadas direto no JSX
- usar `useMemo` para filtro/slice/sort derivados
- quebrar telas grandes em componentes de feature

Meta prática:

- páginas preferencialmente abaixo de 250 linhas
- componentes preferencialmente abaixo de 200 linhas

Arquivos que já pedem refatoração incremental (linhas atuais):

- `pages/clinic/NewPatientPage2.tsx` (~341)
- `pages/clinic/ProgramDetailPage.tsx` (~334)
- `pages/clinic/DashboardPage.tsx` (~327)
- `pages/admin/NewClinicPage.tsx` (~308)
- `components/clinic/program/StepConfigureExercises.tsx` (~371)

---

## 12. Segurança frontend

- ocultar ação na UI melhora UX, mas não protege regra
- backend deve validar autorização em todo endpoint
- frontend nunca assume permissão como garantia

---

## 13. Antipadrões proibidos

- usar `fetch` direto para endpoints da API
- duplicar lógica de parsing do mesmo payload em páginas diferentes
- acoplar page A importando estado interno da page B
- manter regra de negócio crítica no JSX
- adicionar biblioteca nova sem ganho claro
- introduzir `any e unknown` para "destravar rápido" sem plano de correção
- colocar `created_at`/`updated_at` em entidades de domínio
- colocar shapes de resposta da API (`ApiXxxResponse`) no domain
- colocar DTOs de escrita (`XxxPayload`) no domain
- colocar constantes de label de UI no domain
- usar `snake_case` em campos de entidades de domínio TypeScript
- loader do React Router importar repositório de `infrastructure/` diretamente

---

## 14. Checklist de PR frontend

1. Sem `any e unknown` novo sem justificativa técnica.
2. Estados de loading/erro/vazio cobertos.
3. Queries e mutations em `application/` quando reutilizáveis.
4. Chamadas HTTP via `apiClient`.
5. Tipos de domínio em `domain/` — entidades puras (camelCase, sem campos de infra, sem DTOs de API).
6. DTOs de escrita (`XxxWriteDto`) em `application/ports.ts`.
7. DTOs de API (snake_case, timestamps) internos ao arquivo do repositório em `infrastructure/`.
8. Loaders do React Router chamam funções de `application/`, não repositórios de `infrastructure/`.
9. Constantes de UI (labels, cores) em `application/` ou nas pages — nunca em `domain/`.
10. Tela/componentes grandes quebrados quando necessário.
11. Convenções de nome e pasta respeitadas.
12. Validações executadas:
    - `npm run lint`
    - `npm run types`
    - `npm run format:check`

---

## 15. Referência: módulo feature como padrão DDD

O módulo `admin/feature` é o módulo de referência com DDD raiz aplicado. Use como modelo para novos módulos.

Estrutura:

```
domain/admin/feature.ts              ← entidade pura (Feature, FeatureType)
application/admin/ports.ts           ← FeaturesRepository interface + FeatureWriteDto
application/admin/use-features.ts    ← hooks RQ + funções puras (listFeatures, findFeatureById) + featureTypes
infrastructure/repositories/
  api-admin-features.ts              ← ApiFeatureDto (interno) + toFeature() + toApiPayload() + implementação
  mock-features.ts                   ← mock usando o tipo Feature do domain
pages/admin/feature/
  FeatureListPage.tsx / FeatureNewPage.tsx / FeatureEditPage.tsx
App.tsx                              ← loaders chamam listFeatures/findFeatureById de application/
```

---

## 16. Como adicionar uma nova entidade (passo a passo)

> Siga esta receita sempre que criar um novo recurso. Referência: `admin/feature`.

### Passo 1 — `domain/<guard>/<entidade>.ts`

Entidade pura de negócio. **camelCase obrigatório. Sem infra.**

```typescript
// domain/admin/plan.ts
export type BillingType = 'fixed' | 'per_user';  // union type explícito, não string

export interface Plan {
    id: number;
    name: string;
    billingType: BillingType;   // camelCase
    monthlyValue: number;       // camelCase
    annualValue: number;        // camelCase
    // ❌ NÃO: created_at, updated_at, ApiPlanResponse, PlanPayload, billingTypes
}
```

### Passo 2 — `application/<guard>/ports.ts`

Adicionar `XxxWriteDto` e interface `XxxRepository`. Estes são concerns de aplicação, não de domínio.

```typescript
// application/admin/ports.ts (adicionar ao arquivo existente)

/** DTO de escrita (camelCase, application concern) */
export interface PlanWriteDto {
    name: string;
    billingType: 'fixed' | 'per_user';
    monthlyValue: number;
    annualValue: number;
}

export interface PlansRepository {
    list(params?: { search?: string; per_page?: number; page?: number }): Promise<Plan[]>;
    getById(id: number): Promise<Plan | null>;
    create(data: PlanWriteDto): Promise<Plan>;
    update(id: number, data: PlanWriteDto): Promise<Plan>;
    destroy(id: number): Promise<void>;
}
```

### Passo 3 — `infrastructure/repositories/api-<guard>-<entidade>.ts`

DTOs de API internos + mappers + implementação concreta.

```typescript
// infrastructure/repositories/api-admin-plans.ts

import type { PlanWriteDto, PlansRepository } from '@/application/admin/ports';
import type { Plan, BillingType } from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

/** DTO interno — shape da API. NUNCA exportar. */
interface ApiPlanDto {
    id: number;
    name: string;
    billing_type: string;       // snake_case fica aqui
    monthly_value: number;      // snake_case fica aqui
    annual_value: number;       // snake_case fica aqui
    created_at: string;         // timestamps ficam aqui
    updated_at: string;
}

interface ApiPlanResponseDto { data: ApiPlanDto; }
interface ApiPlanListResponseDto { data: { data: ApiPlanDto[] } }

/** Mapper: API DTO → Domain Entity (snake_case → camelCase) */
function toPlan(raw: ApiPlanDto): Plan {
    return {
        id: raw.id,
        name: raw.name,
        billingType: raw.billing_type as BillingType,
        monthlyValue: Number(raw.monthly_value),
        annualValue: Number(raw.annual_value),
        // created_at e updated_at descartados
    };
}

/** Mapper: Domain Write DTO → API payload (camelCase → snake_case) */
function toApiPayload(dto: PlanWriteDto): Record<string, unknown> {
    return {
        name: dto.name,
        billing_type: dto.billingType,
        monthly_value: dto.monthlyValue,
        annual_value: dto.annualValue,
    };
}

export const apiPlansRepository: PlansRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<ApiPlanListResponseDto>('/admin/plans', { params });
        return (data?.data?.data ?? []).map(toPlan);
    },
    async getById(id) {
        const { data } = await apiClient.get<ApiPlanResponseDto>(`/admin/plans/${id}`);
        if (!data?.data) return null;
        return toPlan(data.data);
    },
    async create(payload) {
        const { data } = await apiClient.post<ApiPlanResponseDto>('/admin/plans', toApiPayload(payload));
        return toPlan(data.data);
    },
    async update(id, payload) {
        const { data } = await apiClient.put<ApiPlanResponseDto>(`/admin/plans/${id}`, toApiPayload(payload));
        return toPlan(data.data);
    },
    async destroy(id) {
        await apiClient.delete(`/admin/plans/${id}`);
    },
};
```

Registrar no barrel:

```typescript
// infrastructure/repositories/index.ts
export { apiPlansRepository } from './api-admin-plans';
```

### Passo 4 — `application/<guard>/use-<entidade>.ts`

Hooks React Query + funções puras para loaders + constantes de UI.

```typescript
// application/admin/use-plans.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { PlanWriteDto } from '@/application/admin/ports';
import type { BillingType } from '@/domain/admin';
import type { ApiErrorResponse } from '@/domain/api';
import { apiPlansRepository } from '@/infrastructure/repositories';

/** Constante de UI — pertence à application, nunca ao domain */
export const billingTypes: { value: BillingType; label: string }[] = [
    { value: 'fixed', label: 'Valor fixo' },
    { value: 'per_user', label: 'Por usuário' },
];

// Funções puras (não-hook) — usáveis em loaders do React Router
export function listPlans(params?: { search?: string; per_page?: number; page?: number }) {
    return apiPlansRepository.list(params);
}

export function findPlanById(id: number) {
    return apiPlansRepository.getById(id);
}

// Hooks React Query
export function usePlans(params?: { search?: string }) {
    return useQuery({
        queryKey: ['admin', 'plans', params],
        queryFn: () => apiPlansRepository.list(params),
    });
}

export function usePlan(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'plan', id],
        queryFn: () => (id ? apiPlansRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreatePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlanWriteDto) => apiPlansRepository.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            toast.success('Plano criado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao criar plano.');
        },
    });
}

export function useUpdatePlan(planId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlanWriteDto) => apiPlansRepository.update(planId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'plan', planId] });
            toast.success('Plano atualizado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao atualizar plano.');
        },
    });
}

export function useDeletePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiPlansRepository.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            toast.success('Plano removido com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao excluir plano.');
        },
    });
}
```

Registrar nos exports:

```typescript
// application/admin/index.ts
export * from './use-plans';
```

### Passo 5 — `pages/<guard>/<entidade>/`

Três arquivos: **ListPage**, **NewPage**, **EditPage**.

**EntityListPage** — cobre loading / vazio / erro:

```tsx
// pages/admin/plan/PlanListPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDeletePlan, usePlans } from '@/application/admin';

export default function PlanListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: plans, isLoading, isError } = usePlans({ search });
    const { mutate: deletePlan } = useDeletePlan();

    if (isLoading) return <p>Carregando...</p>;
    if (isError)   return <p>Erro ao carregar planos.</p>;

    return (
        <div>
            {/* input de busca, tabela, botões de ação */}
            {plans?.length === 0 && <p>Nenhum plano cadastrado.</p>}
        </div>
    );
}
```

**EntityNewPage** — bloqueia durante envio, exibe erros de API:

```tsx
// pages/admin/plan/PlanNewPage.tsx
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCreatePlan } from '@/application/admin';
import type { PlanWriteDto } from '@/application/admin/ports';

const schema = z.object({
    name: z.string().min(1, 'Nome obrigatório'),
    billingType: z.enum(['fixed', 'per_user']),
    monthlyValue: z.number().min(0),
    annualValue: z.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export default function PlanNewPage() {
    const navigate = useNavigate();
    const form = useForm<FormValues>({ resolver: zodResolver(schema) });
    const { mutate: create, isPending } = useCreatePlan({
        onSuccess: () => navigate('/admin/planos'),
    });

    function onSubmit(values: FormValues) {
        create(values as PlanWriteDto);
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* campos do formulário */}
            <button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
            </button>
        </form>
    );
}
```

**EntityEditPage** — pré-carrega via loader, bloqueia durante envio:

```tsx
// pages/admin/plan/PlanEditPage.tsx
import { useNavigate, useLoaderData } from 'react-router-dom';
import { useUpdatePlan } from '@/application/admin';
import type { Plan } from '@/domain/admin';
import type { PlanWriteDto } from '@/application/admin/ports';

export default function PlanEditPage() {
    const plan = useLoaderData() as Plan;
    const navigate = useNavigate();
    const { mutate: update, isPending } = useUpdatePlan(plan.id, {
        onSuccess: () => navigate('/admin/planos'),
    });

    function onSubmit(values: PlanWriteDto) {
        update(values);
    }

    return (
        <form onSubmit={/* form.handleSubmit(onSubmit) */}>
            {/* campos pré-preenchidos com `plan` */}
            <button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
            </button>
        </form>
    );
}
```

### Passo 6 — Registrar rotas em `App.tsx`

Loaders **devem** chamar `application/`, nunca `infrastructure/` diretamente.

```typescript
// App.tsx
import { listPlans, findPlanById } from '@/application/admin';
import PlanListPage from './pages/admin/plan/PlanListPage';
import PlanNewPage from './pages/admin/plan/PlanNewPage';
import PlanEditPage from './pages/admin/plan/PlanEditPage';

// Dentro de children do /admin:
{ path: 'planos', element: <PlanListPage />,
  loader: async () => {
      try {
          const plans = await listPlans();
          return { plans, error: null };
      } catch (err) {
          return { plans: [], error: 'Erro ao carregar planos.' };
      }
  }
},
{ path: 'planos/novo', element: <PlanNewPage /> },
{
    path: 'planos/:id/editar',
    element: <PlanEditPage />,
    loader: async ({ params }) => {
        const id = parseInt(params.id!, 10);
        if (isNaN(id)) return redirect('/admin/planos');
        const plan = await findPlanById(id);
        if (!plan) return redirect('/admin/planos');
        return plan;
    },
},
```

### Resumo da estrutura final

```
domain/admin/plan.ts                          ← Plan, BillingType
application/admin/ports.ts                    ← PlanWriteDto, PlansRepository
application/admin/use-plans.ts                ← listPlans, findPlanById, usePlans, useCreatePlan...
application/admin/index.ts                    ← re-exporta use-plans
infrastructure/repositories/api-admin-plans.ts ← ApiPlanDto (privado) + toPlan + toApiPayload + impl
infrastructure/repositories/index.ts          ← exporta apiPlansRepository
pages/admin/plan/PlanListPage.tsx
pages/admin/plan/PlanNewPage.tsx
pages/admin/plan/PlanEditPage.tsx
App.tsx                                       ← rotas com loaders chamando listPlans/findPlanById
```

---

## 16. Plano incremental recomendado

### Fase 1 — padronização de dados

1. Consolidar queries de admin/clinic em `application/` (evitar lógica de fetch na page).
2. Revisar `queryKey` por entidade.
3. Garantir invalidação consistente após mutation.

### Fase 2 — redução de páginas monolíticas

1. Quebrar páginas acima de 300 linhas em blocos de feature.
2. Extrair utilitários puros para `lib/`.
3. Remover duplicação de filtros e formatadores.

### Fase 3 — fortalecimento de tipagem (DDD)

1. Aplicar o padrão do módulo feature nos demais módulos admin (clinic, plan, exercises).
2. Mover `ApiXxxResponse` e `XxxPayload` do domain para infra/application onde existirem.
3. Renomear campos snake_case para camelCase nas entidades de domínio.
4. Eliminar `any e unknown` residual em boundaries de API.
5. Preparar subida gradual de rigor de `tsconfig`.

### Fase 4 — estabilidade visual e testes

1. Uniformizar comportamento de tabela e formulário.
2. Revisar feedbacks de erro/sucesso por fluxo.
3. Adicionar testes de fluxo crítico conforme evolução da base.
