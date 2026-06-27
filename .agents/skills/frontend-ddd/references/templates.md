# DDD Templates (fisioweb)

Templates copy-pasteáveis espelhando o módulo `admin/feature` (referência DDD do projeto). Substitua `<Entity>`/`<entity>`/`<entities>`/`<contexto>` (admin ou clinic).

## 1. Domain — entidade pura

`resources/js/domain/<contexto>/<entity>.ts`

```ts
/** <Entity> — contexto <contexto> */

export type <Entity>Status = 'active' | 'inactive';   // union explícito, não string

export interface <Entity> {
    id: number;
    name: string;
    status: <Entity>Status;
    ownerId: number | null;     // camelCase, sem snake_case
}
```

**Proibido aqui:** `created_at`, `updated_at`, `ApiXxx`, `XxxWriteDto`, `featureTypes`.

Atualize `domain/<contexto>/index.ts` para re-exportar:

```ts
export * from './<entity>';
```

## 2. Application — Ports + WriteDto

`resources/js/application/<contexto>/ports.ts` (adicionar ao arquivo existente):

```ts
import type { <Entity> } from '@/domain/<contexto>';

/** DTO de escrita — camelCase, application concern */
export interface <Entity>WriteDto {
    name: string;
    status: 'active' | 'inactive';
    ownerId: number | null;
}

export interface <Entity>sRepository {
    list(params?: {
        search?: string;
        status?: string;
        per_page?: number;
        page?: number;
    }): Promise<<Entity>[]>;
    getById(id: number): Promise<<Entity> | null>;
    create(data: <Entity>WriteDto): Promise<<Entity>>;
    update(id: number, data: <Entity>WriteDto): Promise<<Entity>>;
    destroy(id: number): Promise<void>;
}
```

> Quando o backend retornar paginator, declare o retorno como `Promise<{ data: <Entity>[]; meta: { currentPage: number; lastPage: number; total: number } }>` — ver `AdminExercisesRepository` como modelo.

## 3. Infrastructure — Repository concreto + mapper

`resources/js/infrastructure/repositories/api-<contexto>-<entities>.ts`

```ts
import type { <Entity>sRepository, <Entity>WriteDto } from '@/application/<contexto>/ports';
import type { <Entity> } from '@/domain/<contexto>';
import { apiClient } from '@/infrastructure/api/client';

/** Shape exato da API (snake_case) — interno ao repositório */
interface Api<Entity> {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    owner_id: number | null;
    created_at: string;
    updated_at: string;
}

function mapEntity(raw: Api<Entity>): <Entity> {
    return {
        id: raw.id,
        name: raw.name,
        status: raw.status,
        ownerId: raw.owner_id,
    };
}

function toApiPayload(dto: <Entity>WriteDto): Record<string, unknown> {
    return {
        name: dto.name,
        status: dto.status,
        owner_id: dto.ownerId,
    };
}

export const api<Entity>sRepository: <Entity>sRepository = {
    async list(params) {
        const { data } = await apiClient.get<{ data: Api<Entity>[] }>(
            '/api/<contexto>/<entities>',
            { params },
        );
        return data.data.map(mapEntity);
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: Api<Entity> }>(
            `/api/<contexto>/<entities>/${id}`,
        );
        return data.data ? mapEntity(data.data) : null;
    },

    async create(dto) {
        const { data } = await apiClient.post<{ data: Api<Entity> }>(
            '/api/<contexto>/<entities>',
            toApiPayload(dto),
        );
        return mapEntity(data.data);
    },

    async update(id, dto) {
        const { data } = await apiClient.put<{ data: Api<Entity> }>(
            `/api/<contexto>/<entities>/${id}`,
            toApiPayload(dto),
        );
        return mapEntity(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/api/<contexto>/<entities>/${id}`);
    },
};
```

Adicione export no barrel `infrastructure/repositories/index.ts`:

```ts
export { api<Entity>sRepository } from './api-<contexto>-<entities>';
```

## 4. Application — Hooks + use-cases puros

`resources/js/application/<contexto>/use-<entities>.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { <Entity>WriteDto } from '@/application/<contexto>/ports';
import type { ApiErrorResponse } from '@/domain/api';
import { api<Entity>sRepository } from '@/infrastructure/repositories';

// ---------------------------------------------------------------------------
// Funções puras de use-case — consumidas por loaders do React Router
// ---------------------------------------------------------------------------

export function list<Entity>s(params?: {
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
}) {
    return api<Entity>sRepository.list(params);
}

export function find<Entity>ById(id: number) {
    return api<Entity>sRepository.getById(id);
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function use<Entity>s(params?: { search?: string; status?: string; per_page?: number; page?: number }) {
    return useQuery({
        queryKey: ['<contexto>', '<entities>', params],
        queryFn: () => api<Entity>sRepository.list(params),
    });
}

export function use<Entity>(id: number | undefined) {
    return useQuery({
        queryKey: ['<contexto>', '<entity>', id],
        queryFn: () => (id ? api<Entity>sRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreate<Entity>(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: <Entity>WriteDto) => api<Entity>sRepository.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['<contexto>', '<entities>'] });
            toast.success('<Entity> criado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao criar.');
        },
    });
}

export function useUpdate<Entity>(id: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: <Entity>WriteDto) => api<Entity>sRepository.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['<contexto>', '<entities>'] });
            queryClient.invalidateQueries({ queryKey: ['<contexto>', '<entity>', id] });
            toast.success('<Entity> atualizado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao atualizar.');
        },
    });
}

export function useDelete<Entity>(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api<Entity>sRepository.destroy(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['<contexto>', '<entities>'] });
            queryClient.invalidateQueries({ queryKey: ['<contexto>', '<entity>', id] });
            toast.success('<Entity> removido com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao excluir.');
        },
    });
}
```

Atualize `application/<contexto>/index.ts` para re-exportar:

```ts
export * from './use-<entities>';
```

## 5. Constantes de UI — ficam em `application/`, NUNCA em `domain/`

```ts
// application/<contexto>/use-<entities>.ts (no topo do arquivo)
import type { <Entity>Status } from '@/domain/<contexto>';

export const <entity>Statuses: { value: <Entity>Status; label: string }[] = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
];
```

## 6. Routes — loader chama `application/`

`resources/js/routes/<contexto>/<entity>-routes.tsx`

```tsx
import { redirect, type RouteObject } from 'react-router-dom';

import { find<Entity>ById, list<Entity>s } from '@/application/<contexto>';
import <Entity>EditPage from '@/pages/<contexto>/<entity>/<Entity>EditPage';
import <Entity>ListPage from '@/pages/<contexto>/<entity>/<Entity>ListPage';
import <Entity>NewPage from '@/pages/<contexto>/<entity>/<Entity>NewPage';

export const <entity>Routes: RouteObject[] = [
    {
        path: '<entities>',
        element: <<Entity>ListPage />,
        loader: async () => {
            try {
                const items = await list<Entity>s();
                return { items, error: null };
            } catch (err) {
                const res = (err as { response?: { data?: { message?: string } } })?.response?.data;
                return {
                    items: [],
                    error: res?.message ?? (err instanceof Error ? err.message : 'Erro ao carregar.'),
                };
            }
        },
    },
    { path: '<entities>/novo', element: <<Entity>NewPage /> },
    {
        path: '<entities>/:id/editar',
        element: <<Entity>EditPage />,
        loader: async ({ params }) => {
            const id = parseInt(params.id!, 10);
            if (isNaN(id)) return redirect('/<contexto>/<entities>');
            const item = await find<Entity>ById(id);
            if (!item) return redirect('/<contexto>/<entities>');
            return item;
        },
    },
];
```

Plug em `routes/<contexto>-routes.tsx`:

```ts
import { <entity>Routes } from './<contexto>/<entity>-routes';
// dentro do children: [...<entity>Routes, ...]
```

## 7. Pages — composição

### ListPage

Padrão real: `pages/admin/feature/FeatureListPage.tsx`. Estrutura mínima:

```tsx
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';

import { useDelete<Entity> } from '@/application/<contexto>';
import { DataTable } from '@/components/ui/data-table';
// ... shadcn imports
import type { <Entity> } from '@/domain/<contexto>';

export default function <Entity>ListPage() {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { items, error } = useLoaderData() as { items: <Entity>[]; error: string | null };

    const deleteMutation = useDelete<Entity>({ onSuccess: () => revalidator.revalidate() });

    // estado de UI (busca, filtros, paginação local)
    const [appliedSearch, setAppliedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filtered = useMemo(
        () => items.filter((i) => !appliedSearch || i.name.toLowerCase().includes(appliedSearch.toLowerCase())),
        [items, appliedSearch],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedData = useMemo(
        () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filtered, currentPage],
    );

    return (
        <div className="space-y-6 p-4 md:p-6">
            {error && (
                <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
                    {error}
                </div>
            )}
            {/* filtros, botão Novo, DataTable */}
        </div>
    );
}
```

**Pontos:**
- `useLoaderData` para dados iniciais; tipa explicitamente.
- `useRevalidator` para reexecutar loader após mutation.
- `useMemo` para filtros/paginação local.
- Mutations vêm de `application/`, com `onSuccess: revalidator.revalidate`.
- Cobrir loading/erro/vazio (DataTable já trata vazio via `emptyMessage`).

### NewPage / EditPage com Forms

Use **React Hook Form + Zod** (padrão obrigatório). Detalhes em [`forms.md`](forms.md).

## 8. Barrel exports

Cada `index.ts` re-exporta o que está no diretório:

`domain/<contexto>/index.ts`:
```ts
export * from './<entity>';
export * from './<outro>';
```

`application/<contexto>/index.ts`:
```ts
export * from './ports';
export * from './use-<entities>';
```

`infrastructure/repositories/index.ts`:
```ts
export { api<Entity>sRepository } from './api-<contexto>-<entities>';
```

## 9. Anti-patterns proibidos

```ts
// ❌ Loader importando infraestrutura
import { apiFeaturesRepository } from '@/infrastructure/repositories';
loader: async () => apiFeaturesRepository.list();

// ✅ Loader importa application
import { listFeatures } from '@/application/admin';
loader: async () => ({ features: await listFeatures(), error: null });
```

```ts
// ❌ Domain com infra concern
export interface Feature {
    id: number;
    name: string;
    created_at: string;   // ❌
    updated_at: string;   // ❌
}

// ✅ Domain puro
export interface Feature {
    id: number;
    name: string;
}
```

```ts
// ❌ ApiXxx vazando pro domain
// domain/admin/feature.ts
export interface ApiFeature { /* ❌ shape de API */ }

// ✅ ApiXxx privado ao repositório
// infrastructure/repositories/api-admin-features.ts
interface ApiFeature { /* ✅ só usado aqui */ }
```

```ts
// ❌ fetch direto
const r = await fetch('/api/clinic/patients');

// ✅ via apiClient (com JWT interceptor)
import { apiClient } from '@/infrastructure/api/client';
const { data } = await apiClient.get('/api/clinic/patients');
```

```ts
// ❌ WriteDto no domain
// domain/admin/feature.ts
export interface FeatureWriteDto { /* ❌ application concern */ }

// ✅ WriteDto em application/ports.ts
export interface FeatureWriteDto { /* ✅ */ }
```

```tsx
// ❌ Constante de UI no domain
// domain/admin/feature.ts
export const featureTypes = [{ value: 'bool', label: 'Ativo/Inativo' }];  // ❌

// ✅ Em application
// application/admin/use-features.ts
export const featureTypes = [{ value: 'bool', label: 'Ativo/Inativo' }];  // ✅
```

## 10. Checklist PR

1. ✅ `domain/` puro (camelCase, sem `_at`, sem `ApiXxx`, sem `WriteDto`).
2. ✅ `ports.ts` define `XxxRepository` + `XxxWriteDto`.
3. ✅ Repository concreto em `infrastructure/repositories/api-*` com `ApiXxx` privado + mappers.
4. ✅ Hooks `useQuery`/`useMutation` em `application/use-<entities>.ts`.
5. ✅ Funções puras `list<E>` / `find<E>ById` exportadas para loaders.
6. ✅ Loader chama `@/application`, nunca `@/infrastructure`.
7. ✅ Páginas em `pages/<ctx>/<recurso>/`: `EntityListPage`, `EntityNewPage`, `EntityEditPage`.
8. ✅ Forms com RHF + Zod (ver [`forms.md`](forms.md)).
9. ✅ Loading/erro/vazio cobertos.
10. ✅ Mutations invalidam keys + `toast.success/error`.
11. ✅ `npm run types && npm run lint && npm run format`.
