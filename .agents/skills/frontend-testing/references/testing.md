# Testing (fisioweb)

Templates reais do projeto. Stack: Vitest 4 + @testing-library/react v16 + @testing-library/user-event v14.

## Setup compartilhado

`resources/js/test/setup.ts`:

```ts
import '@testing-library/jest-dom';

global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
} as unknown as typeof IntersectionObserver;
```

`vitest.config.ts` (na raiz) já aponta para esse setup. Você só precisa adicionar polyfills aqui se um componente novo exigir (ex.: `ResizeObserver`).

## Test 1 — Repository (mapper snake → camel)

Padrão real: `resources/js/test/api-clinic-exercises.test.ts`.

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClinicExercisesRepository } from '@/infrastructure/repositories/api-clinic-exercises';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { apiClient } from '@/infrastructure/api/client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiClinicExercisesRepository.list', () => {
    it('mapeia snake_case para camelCase nas entidades', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    data: [
                        {
                            id: 1,
                            name: 'Agachamento',
                            physio_area_id: 5,
                            physio_area: { id: 5, name: 'Ortopedia' },
                            created_at: '2026-01-01T00:00:00Z',
                            updated_at: '2026-01-01T00:00:00Z',
                        },
                    ],
                    meta: { current_page: 1, last_page: 1, total: 1 },
                },
            },
        });

        const result = await apiClinicExercisesRepository.list();

        expect(result.data[0].name).toBe('Agachamento');
        expect(result.data[0]).not.toHaveProperty('created_at'); // domain puro
        expect(result.data[0]).not.toHaveProperty('physio_area_id'); // mapeado
        expect(mockGet).toHaveBeenCalledWith('/api/clinic/exercises', { params: undefined });
    });

    it('propaga params de filtro pro apiClient', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: { data: [], meta: {} } },
        });

        await apiClinicExercisesRepository.list({ search: 'pranch', physio_area_id: 5 });

        expect(mockGet).toHaveBeenCalledWith('/api/clinic/exercises', {
            params: { search: 'pranch', physio_area_id: 5 },
        });
    });
});

describe('apiClinicExercisesRepository.create', () => {
    it('envia POST com payload do DTO', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { id: 99, name: 'Novo' } },
        });

        const result = await apiClinicExercisesRepository.create({ name: 'Novo' });

        expect(mockPost).toHaveBeenCalledWith('/api/clinic/exercises', { name: 'Novo' });
        expect(result.id).toBe(99);
    });
});
```

**Pontos:**
- `vi.mock` no topo (Vitest hoist).
- Mock retorna shape espelhando o backend (`data.data.data` por causa do envelope + paginator).
- Asserta que o domain está puro (sem `_at`, sem `_id` quando deveria ser `Id`).
- `vi.clearAllMocks()` em `afterEach`.

## Test 2 — Custom Hook com React Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/infrastructure/repositories', () => ({
    apiClinicPatientsRepository: {
        getById: vi.fn(),
    },
}));

import { apiClinicPatientsRepository } from '@/infrastructure/repositories';
import { usePatient } from '@/application/clinic/use-patients';

function createWrapper() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

describe('usePatient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('retorna paciente quando id é válido', async () => {
        vi.mocked(apiClinicPatientsRepository.getById).mockResolvedValueOnce({
            id: 7, name: 'João', email: 'j@x.com', status: 'active', clinicId: 1,
        });

        const { result } = renderHook(() => usePatient(7), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.name).toBe('João');
        expect(apiClinicPatientsRepository.getById).toHaveBeenCalledWith(7);
    });

    it('não chama API quando id é undefined', async () => {
        const { result } = renderHook(() => usePatient(undefined), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
        expect(apiClinicPatientsRepository.getById).not.toHaveBeenCalled();
    });
});
```

**Por que `retry: false`**: sem isso, falhas no mock ficam retentando e o teste trava.

## Test 3 — Página com filtro e mutation

Padrão real: `resources/js/test/NewProgramPage.test.tsx`.

Estratégia: mockar os **hooks de `application/`** (não os repositórios). É um nível mais alto e desacopla o teste do shape de API.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/application/clinic', () => ({
    usePatients: vi.fn(),
    useCreateProgram: vi.fn(),
}));

import { usePatients, useCreateProgram } from '@/application/clinic';
import NewProgramPage from '@/pages/clinic/program/NewProgramPage';

function renderWithRouter() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={['/clinic/programas/novo']}>
                <Routes>
                    <Route path="/clinic/programas/novo" element={<NewProgramPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('NewProgramPage', () => {
    beforeEach(() => {
        vi.mocked(usePatients).mockReturnValue({
            data: [{ id: 1, name: 'João' }, { id: 2, name: 'Maria' }],
            isLoading: false,
            error: null,
        } as ReturnType<typeof usePatients>);

        vi.mocked(useCreateProgram).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
            error: null,
        } as ReturnType<typeof useCreateProgram>);
    });

    it('mostra opções de pacientes carregadas', () => {
        renderWithRouter();
        expect(screen.getByText('João')).toBeInTheDocument();
        expect(screen.getByText('Maria')).toBeInTheDocument();
    });

    it('chama mutation com payload correto ao submeter', async () => {
        const mutateMock = vi.fn();
        vi.mocked(useCreateProgram).mockReturnValue({
            mutate: mutateMock,
            isPending: false,
            error: null,
        } as ReturnType<typeof useCreateProgram>);

        const user = userEvent.setup();
        renderWithRouter();

        await user.type(screen.getByLabelText(/título/i), 'Programa A');
        await user.click(screen.getByRole('button', { name: /salvar/i }));

        await waitFor(() => {
            expect(mutateMock).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Programa A',
            }));
        });
    });
});
```

**Pontos críticos:**
- `userEvent.setup()` por teste, depois `await user.click/type` (assíncronos).
- `MemoryRouter` para isolar do router real.
- `vi.mocked(hook).mockReturnValue({...})` por teste quando precisa de cenário específico.
- `getByRole('button', { name: /salvar/i })` é mais robusto que `getByText('Salvar')`.

## Test 4 — Interagir com shadcn Select (Portal)

shadcn `Select` renderiza opções em Portal (fora do DOM tree do componente). Use `userEvent.click` para abrir e busca por role:

```tsx
const user = userEvent.setup();
render(<FeatureFiltersBar />);

await user.click(screen.getByRole('combobox', { name: /tipo/i }));
// opções estão no body, ainda visíveis pelo screen
await user.click(screen.getByRole('option', { name: 'Ativa/Inativa' }));

expect(screen.getByRole('combobox', { name: /tipo/i })).toHaveTextContent('Ativa/Inativa');
```

Se não achar `combobox`, inspeccione com `screen.debug()` durante o teste.

## Test 5 — Form RHF + Zod

```tsx
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

it('mostra erro quando submete sem nome', async () => {
    const user = userEvent.setup();
    render(<AgreementForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
        expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument();
    });
});

it('chama onSubmit com valores válidos', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AgreementForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/nome/i), 'Unimed');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Unimed',
        }));
    });
});
```

## Test 6 — Hook com localStorage

Padrão real: `resources/js/test/use-program-draft.test.tsx`.

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();
const saveMock = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-program-draft', () => ({
    programDraftRepository: {
        get:     (...args: unknown[]) => getMock(...args),
        save:    (...args: unknown[]) => saveMock(...args),
        discard: vi.fn(),
    },
}));

import { useProgramDraft } from '@/application/clinic/use-program-draft';

const DRAFT_KEY = 'clinic_new_program_draft';

describe('useProgramDraft', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('prefere draft do backend quando savedAt é mais recente', async () => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            step: 1, selectedIds: ['old'], groups: [], savedAt: 1000,
        }));

        getMock.mockResolvedValueOnce({
            step: 2, selectedIds: ['backend'], groups: [], savedAt: 2000,
        });

        const { result } = renderHook(() => useProgramDraft(1, [], []));

        await waitFor(() => {
            expect(result.current.draft?.selectedIds).toEqual(['backend']);
        });
    });
});
```

## Test 7 — Função pura (lib/permissions)

Padrão real: `resources/js/test/permissions.test.ts`.

```ts
import { describe, expect, it } from 'vitest';
import { hasPermission } from '@/application/clinic/permissions';

describe('hasPermission', () => {
    it('admin tem todas as permissões', () => {
        expect(hasPermission({ role: 'admin' } as any, 'patient.delete')).toBe(true);
    });

    it('user comum não pode deletar paciente', () => {
        expect(hasPermission({ role: 'user' } as any, 'patient.delete')).toBe(false);
    });
});
```

Sem render, sem hook — só função.

## Helpers de queries — preferência

```
Prioridade (mais robusto → mais frágil):

1. getByRole('button', { name: /salvar/i })   ✅ acessibilidade
2. getByLabelText(/nome/i)                    ✅ form
3. getByPlaceholderText(/buscar/i)            ⚠️ se não há label
4. getByText(/programa criado/i)              ⚠️ texto pode mudar
5. getByTestId('exercise-row-1')              ❌ último recurso
```

`*ByRole` é menos frágil a refactors visuais.

## `waitFor` — quando

Use **sempre** que o assert depende de algo assíncrono:
- Após `userEvent.click/type`.
- Após mutation.
- Após `setTimeout` em hook.

```ts
await waitFor(() => {
    expect(mock).toHaveBeenCalledWith(/*...*/);
});
```

Não use `setTimeout` manual no teste — `waitFor` já tem retry com timeout configurável.

## `act` — quando

`userEvent` e `waitFor` já envolvem em `act` por dentro. Use `act` manual só para:
- Forçar estado em hook isolado: `act(() => result.current.setX(5))`.
- Fake timers + avanço: `act(() => vi.advanceTimersByTime(1000))`.

## Anti-padrões

### 1. Mockar `fetch` em vez de `apiClient`

```ts
// ❌
global.fetch = vi.fn();

// ✅ projeto não usa fetch
vi.mock('@/infrastructure/api/client');
```

### 2. Asserts sem `waitFor` após ação async

```ts
// ❌ flaky
await user.click(button);
expect(mock).toHaveBeenCalled();

// ✅
await user.click(button);
await waitFor(() => expect(mock).toHaveBeenCalled());
```

### 3. `getByTestId` por preguiça

```tsx
// ❌
screen.getByTestId('submit-btn');

// ✅
screen.getByRole('button', { name: /salvar/i });
```

### 4. Render com Router real e API real

```ts
// ❌ acopla teste de página ao backend e ao roteador inteiro
import { BrowserRouter } from 'react-router-dom';
render(<BrowserRouter><App /></BrowserRouter>);

// ✅ MemoryRouter + mock dos hooks
```

### 5. Não limpar mocks entre testes

```ts
// ❌ contagem de chamadas vaza
it('test 1', () => { mock(); expect(mock).toHaveBeenCalledTimes(1); });
it('test 2', () => { expect(mock).toHaveBeenCalledTimes(0); }); // ❌ falha
```

Sempre `vi.clearAllMocks()` ou `beforeEach`.

## Checklist — antes de mergear teste

- [ ] Arquivo em `resources/js/test/`.
- [ ] `vi.mock` no topo (não dentro de função).
- [ ] `vi.clearAllMocks()` em `beforeEach` ou `afterEach`.
- [ ] `userEvent.setup()` por teste para interação.
- [ ] `waitFor` em asserts após ação async.
- [ ] Queries com `*ByRole` / `*ByLabelText`, evitar `*ByTestId`.
- [ ] React Query com `retry: false` no QueryClient do teste.
- [ ] Teste roda em < 1s (use fake timers se há `setInterval`/longos `setTimeout`).
- [ ] Nome do teste em PT descrevendo comportamento, não implementação.
- [ ] `npm run test` passa.
