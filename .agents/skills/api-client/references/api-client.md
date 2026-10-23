# API Client (fisioweb)

`apiClient` é um `axios.create({ baseURL: '/api', ... })`. Toda URL no Repository é **relativa a `/api`**.

## Anatomia do Repository

Padrão real (espelha `infrastructure/repositories/api-admin-features.ts`).

```ts
import type { <Entity>sRepository, <Entity>WriteDto } from '@/application/<contexto>/ports';
import type { <Entity> } from '@/domain/<contexto>';
import { apiClient } from '@/infrastructure/api/client';

// ── shape exato da API (snake_case) — interno ao arquivo ──────────────────
interface Api<Entity> {
    id: number;
    name: string;
    owner_id: number | null;
    created_at: string;
    updated_at: string;
}

// ── mappers ──────────────────────────────────────────────────────────────
function mapEntity(raw: Api<Entity>): <Entity> {
    return {
        id: raw.id,
        name: raw.name,
        ownerId: raw.owner_id,
    };
}

function toApiPayload(dto: <Entity>WriteDto): Record<string, unknown> {
    return {
        name: dto.name,
        owner_id: dto.ownerId,
    };
}

// ── impl ──────────────────────────────────────────────────────────────────
export const api<Entity>sRepository: <Entity>sRepository = {
    async list(params) {
        const { data } = await apiClient.get<{ data: Api<Entity>[] }>(
            '/admin/<entities>',           // baseURL '/api' é injetado → vira /api/admin/<entities>
            { params },
        );
        return data.data.map(mapEntity);
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: Api<Entity> }>(`/admin/<entities>/${id}`);
        return data.data ? mapEntity(data.data) : null;
    },

    async create(dto) {
        const { data } = await apiClient.post<{ data: Api<Entity> }>(
            '/admin/<entities>',
            toApiPayload(dto),
        );
        return mapEntity(data.data);
    },

    async update(id, dto) {
        const { data } = await apiClient.put<{ data: Api<Entity> }>(
            `/admin/<entities>/${id}`,
            toApiPayload(dto),
        );
        return mapEntity(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/<entities>/${id}`);
    },
};
```

**Não esqueça:** adicionar `export { api<Entity>sRepository } from './api-<contexto>-<entities>';` em `infrastructure/repositories/index.ts`.

## Endpoint que pode aceitar 404

Quando "não achei" é resposta válida (busca por id em página de edição que pode 302):

```ts
async getById(id) {
    try {
        const { data } = await apiClient.get<{ data: Api<Entity> }>(`/admin/<entities>/${id}`);
        return mapEntity(data.data);
    } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
            return null;
        }
        throw err;
    }
}
```

**Cuidado:** 401 nunca é tratado aqui — o interceptor já redireciona pro login.

## Endpoint paginado (envelope `data.data`)

Backend retorna paginator dentro do envelope `data`. Resultado: `data.data.data` para items, `data.data.meta` para paginação.

```ts
interface PaginatedResponse<T> {
    data: T[];
    meta: { current_page: number; last_page: number; total: number };
}

async list(params) {
    const { data } = await apiClient.get<{ data: PaginatedResponse<Api<Entity>> }>(
        '/admin/<entities>',
        { params },
    );
    return {
        data: data.data.data.map(mapEntity),
        meta: {
            currentPage: data.data.meta.current_page,
            lastPage:    data.data.meta.last_page,
            total:       data.data.meta.total,
        },
    };
}
```

## Upload de arquivo

```ts
async upload(file: File, patientId: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', String(patientId));

    const { data } = await apiClient.post<{ data: ApiPatientFile }>(
        '/clinic/patient-files',
        formData,
        // axios detecta FormData e seta multipart/form-data automaticamente;
        // não force Content-Type — quebra o boundary
    );
    return mapPatientFile(data.data);
}
```

Para progress callback (barra de upload):

```ts
async upload(file: File, onProgress: (pct: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    await apiClient.post('/clinic/patient-files', formData, {
        onUploadProgress: (evt) => {
            if (evt.total) {
                onProgress(Math.round((evt.loaded / evt.total) * 100));
            }
        },
    });
}
```

## Download de PDF/binário

```ts
async downloadReport(id: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/clinic/reports/${id}.pdf`, {
        responseType: 'blob',
    });
    return data;
}

// Uso na página:
const blob = await reportsRepository.downloadReport(id);
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `relatorio-${id}.pdf`;
a.click();
window.URL.revokeObjectURL(url);
```

## Upload com URL presignada (Cloudflare R2)

Padrão do projeto para vídeos. O backend devolve URL temporária, e o frontend manda direto pro R2 (sem passar pelo Laravel):

```ts
async uploadVideo(file: File): Promise<AdminVideo> {
    // 1. pede URL presignada
    const { upload_url, path, video } = await apiClient.post<{
        upload_url: string;
        path: string;
        video: AdminVideo;
    }>('/admin/videos/presigned-upload', {
        filename: file.name,
        mime_type: file.type,
        size: file.size,
    }).then(r => r.data);

    // 2. upload DIRETO pro R2 — NÃO usa apiClient (URL externa, sem JWT)
    await axios.put(upload_url, file, {
        headers: { 'Content-Type': file.type },
    });

    // 3. confirma upload no backend
    const { data } = await apiClient.post<{ data: AdminVideo }>(
        `/admin/videos/${video.id}/confirm-upload`,
        { path },
    );
    return data.data;
}
```

**Por que `axios.put` cru no passo 2:** a URL é externa (R2/S3), não passa pelo `baseURL: '/api'` e não deve receber `Authorization`. Use `axios` direto (importado do pacote, não o `apiClient`).

## Impersonation — admin loga como clínica

```ts
import { setSessionAuth } from '@/infrastructure/api/client';

// Em página do admin:
const handleLoginAsClinic = async (clinicId: number) => {
    const { access_token } = await apiClinicsRepository.loginAs(clinicId);
    setSessionAuth(access_token, 'clinic');
    // Abrir em nova aba para não pisar no localStorage do admin
    window.open('/clinica', '_blank');
};
```

A nova aba:
1. Carrega `/clinica` → JS lê `getStoredAuth()`.
2. `sessionStorage` tem prioridade → retorna `{ token, guard: 'clinic' }`.
3. Aba original (admin) continua porque `localStorage.auth_token_admin` está intacto.

Sair da impersonation:

```ts
import { clearStoredAuth } from '@/infrastructure/api/client';

clearStoredAuth('clinic');
// se a aba era de impersonation, redireciona pro login
// se for a aba normal do admin, segue ativo
```

## Refresh — como funciona

O interceptor de response captura 401, chama `refresh(guard)` (em `auth.service.ts`), guarda o novo token, e **refaz o request original** com o token novo. Tudo transparente.

Se o refresh **também** falhar (401), o interceptor:
1. Limpa o token daquele guard.
2. Redireciona para `/admin/login` ou `/clinica/login`.

**O que você nunca faz no Repository:**
- Pegar 401 e tentar refresh.
- Lidar com expiração de token.
- Redirecionar pro login.

Tudo isso vem grátis pelo interceptor.

## Erros — `ApiErrorResponse`

Definido em `domain/api.ts`. Shape esperado:

```ts
{
    response?: {
        data?: {
            message?: string;        // erro geral
            errors?: Record<string, string[]>;   // erros de validação 422
        };
        status?: number;
    };
}
```

No hook React Query, use no `onError`:

```ts
onError: (err: ApiErrorResponse) => {
    toast.error(err?.response?.data?.message ?? 'Erro genérico.');
}
```

Para mapear `errors.x = ['msg']` em form RHF, ver [`frontend-ddd/references/forms.md`](../../frontend-ddd/references/forms.md#erros-vindos-do-backend-422).

## Cancelar request em flight (raro)

Quando um filtro muda rápido (paciente digita) e quer cancelar fetch antigo. React Query já faz isso para você via `signal`. Se precisar manual:

```ts
const controller = new AbortController();
apiClient.get('/clinic/exercises', { signal: controller.signal });
// depois:
controller.abort();
```

## Anti-padrões

### 1. `fetch` direto

```ts
// ❌
const res = await fetch('/api/clinic/patients', {
    headers: { Authorization: `Bearer ${token}` },
});
```

Quebra refresh, multi-guard, e centralização de erros. Use `apiClient`.

### 2. Vazar `ApiXxx` pro caller

```ts
// ❌ ApiFeature deveria ser interno
export async function listFeatures(): Promise<ApiFeature[]> { ... }

// ✅ devolve entidade do domain
export async function listFeatures(): Promise<Feature[]> { ... }
```

### 3. Setar Authorization manual

```ts
// ❌
apiClient.get('/admin/features', {
    headers: { Authorization: `Bearer ${token}` },
});
```

Interceptor já faz isso. Você está mascarando bug se precisou setar manual.

### 4. Tratar 401 no Repository

```ts
// ❌ rouba a oportunidade do interceptor refrescar
try {
    return await apiClient.get('/admin/features');
} catch (err) {
    if (err.response?.status === 401) redirectToLogin();
    throw err;
}
```

O interceptor faz o redirect. Deixe o 401 subir.

### 5. Importar `apiClient` em página

```tsx
// ❌ em pages/clinic/patient/PatientListPage.tsx
import { apiClient } from '@/infrastructure/api/client';
```

Página chama hook de `application/`, que chama Repository, que usa `apiClient`. Quebrar a camada deixa a página acoplada à infra.

## Checklist — Repository novo

- [ ] Arquivo `infrastructure/repositories/api-<ctx>-<entities>.ts`.
- [ ] `ApiXxx` interface privada (snake_case).
- [ ] `mapEntity()` + `toApiPayload()` puras.
- [ ] URLs **sem** `/api` (axios injeta `baseURL`).
- [ ] URLs começam com `/admin/...` ou `/clinic/...` (guard inferido automaticamente).
- [ ] Métodos retornam tipos do `@/domain/...`.
- [ ] Tipa o axios: `apiClient.get<{ data: ApiXxx }>(...)`.
- [ ] Exportado no barrel `infrastructure/repositories/index.ts`.
- [ ] Implementa a interface declarada em `application/<ctx>/ports.ts`.
- [ ] **Sem** tratamento de 401, **sem** `Authorization` manual.
