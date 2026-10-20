import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { passwordLockReason } from '@/pages/clinic/user/user-edit-prototype/form';
import UserEditPrototype from '@/pages/clinic/user/user-edit-prototype/UserEditPrototype';
import UserNewPrototype from '@/pages/clinic/user/user-edit-prototype/UserNewPrototype';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();
const create = vi.fn();
const update = vi.fn();
const uploadPhoto = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-users', () => ({
    apiClinicUsersRepository: {
        list: () => Promise.resolve([]),
        getById: (...args: unknown[]) => getById(...args),
        create: (...args: unknown[]) => create(...args),
        update: (...args: unknown[]) => update(...args),
        uploadPhoto: (...args: unknown[]) => uploadPhoto(...args),
    },
}));

// A carga da equipe (useTeam) e o Google não importam aqui.
vi.mock('@/application/clinic/use-programs', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useClinicPrograms: () => ({ data: undefined }),
}));
vi.mock('@/application/clinic/use-patients', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    usePatients: () => ({ data: undefined }),
}));
vi.mock('@/application/clinic/use-appointments', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useAppointments: () => ({ data: undefined }),
}));
vi.mock('@/application/clinic/use-google-calendar', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useGoogleCalendarStatus: () => ({
        data: googleStatus,
        isLoading: false,
    }),
}));

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        info: (...args: unknown[]) => toastInfo(...args),
        error: vi.fn(),
    },
}));

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let googleStatus: { connected: boolean; connectedAt?: string } = {
    connected: false,
};

let authUser: {
    id: number;
    name: string;
    email?: string;
    role: string;
    mestre: 0 | 1;
} = {
    id: 1,
    name: 'Admin',
    email: 'admin@clinica.test',
    role: 'admin',
    mestre: 0,
};
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: authUser }),
}));

function renderNew() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/usuarios/novo']}
                future={routerFutureFlags}
            >
                <UserNewPrototype variant="A" />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

function preview() {
    return within(
        screen.getByRole('complementary', { name: 'Pré-visualização' }),
    );
}

function roleCard(name: RegExp) {
    return within(screen.getByRole('radiogroup', { name: 'Função' })).getByRole(
        'radio',
        { name },
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    googleStatus = { connected: false };
    authUser = {
        id: 1,
        name: 'Admin',
        email: 'admin@clinica.test',
        role: 'admin',
        mestre: 0,
    };
});

describe('cadastro de usuário no Crachá ao vivo', () => {
    it('abre vazio, com título de cadastro e placeholders na prévia', () => {
        renderNew();

        expect(
            screen.getByRole('heading', { name: 'Novo usuário' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveValue('');
        expect(screen.getByLabelText('E-mail')).toHaveValue('');
        expect(screen.getByLabelText('CPF')).toHaveValue('');
        expect(screen.getByRole('radio', { name: 'CPF' })).toBeChecked();
        expect(screen.getByRole('switch')).toBeChecked();
        expect(
            screen.getByRole('button', { name: 'Criar usuário' }),
        ).toBeEnabled();

        expect(
            preview().getAllByText('Nome do profissional').length,
        ).toBeGreaterThan(0);
        expect(preview().getByText('Sem documento')).toBeInTheDocument();
        expect(
            preview().getByText('Maria Souza · com Nome do profissional'),
        ).toBeInTheDocument();
        expect(
            preview().getByText('por Nome do profissional'),
        ).toBeInTheDocument();
        expect(preview().queryByText('Mestre')).not.toBeInTheDocument();
        // Sem nome nem foto, o avatar é genérico (não um "?").
        const avatar = screen.getAllByRole('button', {
            name: 'Trocar foto',
        })[0];
        expect(avatar.querySelector('.lucide-user-round')).not.toBeNull();
        expect(avatar).not.toHaveTextContent('?');
    });

    it('não mostra o Google Agenda: ainda não há perfil para conectar', () => {
        renderNew();

        expect(screen.queryByText('Google Agenda')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Integrações' }),
        ).not.toBeInTheDocument();
    });

    it('enviar vazio mostra os erros, senha e função inclusive, sem o stub', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(await screen.findByText('Nome obrigatório')).toBeInTheDocument();
        expect(screen.getByText('E-mail inválido')).toBeInTheDocument();
        expect(screen.getByText('Mínimo de 8 caracteres')).toBeInTheDocument();
        expect(screen.getByText('Confirme a senha')).toBeInTheDocument();
        expect(screen.getByText('Função obrigatória')).toBeInTheDocument();
        expect(screen.getByText('Documento obrigatório.')).toBeInTheDocument();
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it('crachá, agenda e assinatura acompanham nome, função e CREFITO', async () => {
        const user = userEvent.setup();
        renderNew();

        expect(
            preview().getByText(/escolha a função para ver/i),
        ).toBeInTheDocument();

        await user.type(screen.getByLabelText('Nome'), 'Ana Lima');
        await user.click(roleCard(/^fisioterapeuta/i));
        await user.click(screen.getByRole('radio', { name: 'CREFITO' }));
        await user.type(
            screen.getByLabelText('Registro no CREFITO'),
            'MG-123456',
        );

        expect(preview().queryByText('Nome do profissional')).toBeNull();
        expect(
            preview().getByText('Maria Souza · com Ana'),
        ).toBeInTheDocument();
        expect(preview().getByText('por Ana Lima')).toBeInTheDocument();
        expect(
            preview().getByText('Fisioterapeuta · CREFITO MG-123456'),
        ).toBeInTheDocument();

        await user.click(roleCard(/^secretário/i));

        expect(
            preview().queryByText('Na assinatura do PDF'),
        ).not.toBeInTheDocument();
        expect(
            preview().getByText(
                'Secretário(a) não assina evoluções nem programas.',
            ),
        ).toBeInTheDocument();
    });

    it('senha curta ou diferente dá erro, com o indicador de força e sem aviso de código', async () => {
        const user = userEvent.setup();
        renderNew();

        await user.type(screen.getByLabelText('Senha'), 'abc1');
        expect(screen.getByText('Fraca')).toBeInTheDocument();
        await user.tab();
        expect(
            await screen.findByText('Mínimo de 8 caracteres'),
        ).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Senha'));
        await user.type(screen.getByLabelText('Senha'), 'Clinica2026!');
        expect(screen.getByText('Forte')).toBeInTheDocument();
        await user.type(screen.getByLabelText('Confirmar senha'), 'Outra2026!');
        await user.tab();

        expect(
            await screen.findByText('As senhas não coincidem'),
        ).toBeInTheDocument();
        expect(screen.queryByText(/enviamos um código/i)).toBeNull();
    });

    it('criar válido mostra o stub, sem modal de código e sem chamar a API', async () => {
        const user = userEvent.setup();
        const { container } = renderNew();

        await user.type(screen.getByLabelText('Nome'), 'Ana Lima');
        await user.type(screen.getByLabelText('E-mail'), 'ana@clinica.test');
        await user.type(screen.getByLabelText('Senha'), 'Clinica2026!');
        await user.type(
            screen.getByLabelText('Confirmar senha'),
            'Clinica2026!',
        );
        await user.click(roleCard(/^fisioterapeuta/i));
        await user.type(screen.getByLabelText('CPF'), '52998224725');
        const photoInput =
            container.querySelector<HTMLInputElement>('input[type="file"]')!;
        await user.upload(
            photoInput,
            new File(['x'], 'ana.png', { type: 'image/png' }),
        );
        expect(
            screen.getByRole('button', { name: 'Remover foto' }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(toastSuccess).toHaveBeenCalledTimes(1);
        expect(toastSuccess.mock.calls[0][0]).toMatch(
            /nenhum usuário foi criado/i,
        );
        expect(
            screen.queryByRole('dialog', {
                name: /confirme a troca de senha/i,
            }),
        ).not.toBeInTheDocument();
        expect(toastInfo).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
        expect(uploadPhoto).not.toHaveBeenCalled();
        // Não finge sucesso: continua no cadastro, com o que foi digitado.
        expect(
            screen.getByRole('heading', { name: 'Novo usuário' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveValue('Ana Lima');
    });
});

function member(overrides: Partial<ClinicUserSummary> = {}): ClinicUserSummary {
    return {
        id: '7',
        name: 'Bruno Reis',
        role: 'physiotherapist',
        mestre: 0,
        status: 1,
        email: 'bruno@clinica.test',
        document: '52998224725',
        ...overrides,
    };
}

describe('passwordLockReason (tabela do ADR 019)', () => {
    const admin = { id: '1', role: 'admin', mestre: 0 as const };
    const mestre = { id: '2', role: 'admin', mestre: 1 as const };
    const physio = { id: '3', role: 'physiotherapist', mestre: 0 as const };

    it('a própria senha, qualquer um troca (o mestre também)', () => {
        expect(passwordLockReason(physio, member({ id: '3' }))).toBeNull();
        expect(
            passwordLockReason(admin, member({ id: '1', role: 'admin' })),
        ).toBeNull();
        expect(
            passwordLockReason(
                mestre,
                member({ id: '2', role: 'admin', mestre: 1 }),
            ),
        ).toBeNull();
    });

    it('a de outra pessoa, só administrador', () => {
        expect(passwordLockReason(admin, member())).toBeNull();
        expect(passwordLockReason(mestre, member())).toBeNull();
        expect(passwordLockReason(physio, member())).toMatch(
            /só administrador/i,
        );
        expect(
            passwordLockReason(
                { id: '4', role: 'secretary', mestre: 0 },
                member(),
            ),
        ).toMatch(/só administrador/i);
    });

    it('a de outro administrador, só o mestre', () => {
        const other = member({ id: '9', role: 'admin' });
        expect(passwordLockReason(mestre, other)).toBeNull();
        expect(passwordLockReason(admin, other)).toMatch(/só o mestre/i);
    });

    it('a do mestre, ninguém além dele', () => {
        const owner = member({ id: '2', role: 'admin', mestre: 1 });
        expect(passwordLockReason(admin, owner)).toMatch(/só ele mesmo/i);
        expect(passwordLockReason(physio, owner)).toMatch(/só ele mesmo/i);
    });
});

function renderEdit(target: ClinicUserSummary) {
    getById.mockResolvedValue(target);
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[`/clinica/usuarios/${target.id}/editar`]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/usuarios/:id/editar"
                        element={<UserEditPrototype variant="A" />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('edição de usuário no Crachá ao vivo', () => {
    it('carrega o usuário; sem alteração, "Nada alterado" e Salvar desabilitado', async () => {
        const user = userEvent.setup();
        renderEdit(member());

        expect(
            await screen.findByRole('heading', { name: 'Editar usuário' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveValue('Bruno Reis');
        expect(screen.getByText('Nada alterado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

        await user.type(screen.getByLabelText('Nome'), ' Jr');

        expect(screen.getByText('1 alteração: nome')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
        expect(getById).toHaveBeenCalledWith('7');
    });

    it('trocar a foto conta como alteração e habilita Salvar', async () => {
        const user = userEvent.setup();
        const { container } = renderEdit(member());

        await screen.findByText('Nada alterado');
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'bruno.png', { type: 'image/png' }),
        );

        expect(screen.getByText('1 alteração: foto')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    it('salvar sem senha cai no stub, sem modal de código e sem PUT', async () => {
        const user = userEvent.setup();
        renderEdit(member());

        await user.type(await screen.findByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(toastSuccess).toHaveBeenCalledTimes(1);
        expect(toastSuccess.mock.calls[0][0]).toMatch(/nada foi salvo/i);
        expect(toastInfo).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(update).not.toHaveBeenCalled();
        expect(await screen.findByText('Nada alterado')).toBeInTheDocument();
    });

    it('senha nova abre o código, mandado a quem está logado; o código certo salva no stub', async () => {
        const user = userEvent.setup();
        renderEdit(member());

        await user.type(
            await screen.findByLabelText('Nova senha'),
            'Clinica2026!',
        );
        await user.type(
            screen.getByLabelText('Confirmar nova senha'),
            'Clinica2026!',
        );
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        const dialog = await screen.findByRole('dialog', {
            name: 'Confirme a troca de senha',
        });
        // ADR 019: o código vai para o e-mail do administrador, não o do alvo.
        expect(dialog).toHaveTextContent('a***n@clinica.test');
        expect(dialog).not.toHaveTextContent('b***o@clinica.test');
        expect(toastSuccess).not.toHaveBeenCalled();

        const code = String(toastInfo.mock.calls[0][0]).match(/\d{6}/)![0];
        await user.type(
            within(dialog).getByLabelText('Código de 6 dígitos'),
            code,
        );
        await user.click(
            within(dialog).getByRole('button', { name: 'Confirmar e salvar' }),
        );

        expect(toastSuccess).toHaveBeenCalledTimes(1);
        expect(String(toastSuccess.mock.calls[0][1].description)).toMatch(
            /senha: nova senha/i,
        );
        expect(update).not.toHaveBeenCalled();
    });

    it('Google Agenda: status real no próprio perfil; em outra pessoa, só ela conecta', async () => {
        googleStatus = {
            connected: true,
            connectedAt: new Date(Date.now() - 86_400_000).toISOString(),
        };
        authUser = { ...authUser, id: 7, role: 'physiotherapist' };
        const own = renderEdit(member());

        expect(
            await screen.findByRole('heading', { name: 'Meu perfil' }),
        ).toBeInTheDocument();
        expect(screen.getByText(/^Conectado em/)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Desconectar' }),
        ).toBeInTheDocument();
        own.unmount();

        authUser = { ...authUser, id: 1, role: 'admin' };
        renderEdit(member());

        expect(
            await screen.findByText(
                'Só a própria pessoa conecta, no perfil dela.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /conectar/i })).toBeNull();
    });

    it('função e situação só para quem gerencia usuários; no mestre, a função fica travada', async () => {
        authUser = { ...authUser, id: 7, role: 'physiotherapist' };
        const own = renderEdit(member());

        await screen.findByRole('heading', { name: 'Meu perfil' });
        expect(
            screen.queryByRole('heading', { name: 'Função e acesso' }),
        ).toBeNull();
        expect(screen.queryByRole('radiogroup', { name: 'Função' })).toBeNull();
        own.unmount();

        authUser = { ...authUser, id: 1, role: 'admin' };
        renderEdit(member({ id: '2', role: 'admin', mestre: 1 }));

        expect(
            await screen.findByText(
                'Este é o mestre da clínica: a função fica administrador.',
            ),
        ).toBeInTheDocument();
        expect(roleCard(/^administrador/i)).toBeChecked();
        expect(roleCard(/^fisioterapeuta/i)).toBeDisabled();
        expect(roleCard(/^secretário/i)).toBeDisabled();
        expect(screen.getByRole('switch')).toBeDisabled();
        // Senha do mestre: o motivo no lugar do campo.
        expect(
            screen.getByText(
                'A senha do mestre da clínica só ele mesmo troca.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Nova senha')).toBeNull();
    });

    it('sem e-mail na sessão, a troca trava em vez de mandar o código ao alvo (ADR 019)', async () => {
        authUser = { ...authUser, email: undefined };
        renderEdit(member());

        expect(
            await screen.findByText(
                'Sua sessão não tem e-mail para receber o código da troca.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByLabelText('Nova senha')).toBeNull();
        expect(screen.queryByText(/b\*\*\*o@clinica\.test/)).toBeNull();
    });

    it('sem e-mail na sessão, o próprio perfil continua trocando a senha (o alvo é quem está logado)', async () => {
        authUser = {
            ...authUser,
            id: 7,
            role: 'physiotherapist',
            email: undefined,
        };
        const user = userEvent.setup();
        renderEdit(member());

        expect(await screen.findByLabelText('Nova senha')).toBeInTheDocument();
        expect(screen.queryByText(/sessão não tem e-mail/i)).toBeNull();

        // O código vai ao e-mail da própria pessoa (é ela quem está logada).
        await user.type(screen.getByLabelText('Nova senha'), 'Clinica2026!');
        expect(
            screen.getByText(/enviamos um código para b\*\*\*o@clinica\.test/),
        ).toBeInTheDocument();
    });

    it('apagar o nome na edição mostra os placeholders do cadastro (decisão de 2026-10-20)', async () => {
        const user = userEvent.setup();
        renderEdit(member({ photoUrl: undefined }));

        await user.clear(await screen.findByLabelText('Nome'));

        expect(
            preview().getAllByText('Nome do profissional').length,
        ).toBeGreaterThan(1);
        expect(preview().queryByText('Sem nome')).toBeNull();
        expect(
            preview().getByText('Maria Souza · com Nome do profissional'),
        ).toBeInTheDocument();
        const avatar = screen.getAllByRole('button', {
            name: 'Trocar foto',
        })[0];
        expect(avatar.querySelector('.lucide-user-round')).not.toBeNull();
    });
});
