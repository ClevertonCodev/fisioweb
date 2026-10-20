import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import UserEditPrototype from '@/pages/clinic/user/user-edit-prototype/UserEditPrototype';
import { passwordLockReason } from '@/pages/clinic/user/user-form/form';
import { UserNewPage } from '@/pages/clinic/user/UserNewPage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();
const create = vi.fn();
const update = vi.fn();
const uploadPhoto = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();
const toastWarning = vi.fn();
const toastError = vi.fn();

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
        warning: (...args: unknown[]) => toastWarning(...args),
        error: (...args: unknown[]) => toastError(...args),
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
                <Routes>
                    <Route
                        path="/clinica/usuarios/novo"
                        element={<UserNewPage />}
                    />
                    <Route
                        path="/clinica/usuarios"
                        element={<p>Lista de usuários</p>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function fillValidUser(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Nome'), 'Ana Lima');
    await user.type(screen.getByLabelText('E-mail'), 'ana@clinica.test');
    await user.type(screen.getByLabelText('Senha'), 'Clinica2026!');
    await user.type(screen.getByLabelText('Confirmar senha'), 'Clinica2026!');
    await user.click(roleCard(/^fisioterapeuta/i));
    await user.type(screen.getByLabelText('CPF'), '52998224725');
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

describe('cadastro de usuário (tela de verdade)', () => {
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
        // Tela de verdade: sem a barra do protótipo (no Vitest o DEV está
        // ligado, então ela apareceria se a página ainda a tivesse).
        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).toBeNull();
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

    it('criar válido grava pela API, envia a foto e volta para a lista', async () => {
        const user = userEvent.setup();
        create.mockResolvedValue(member({ id: '42', name: 'Ana Lima' }));
        uploadPhoto.mockResolvedValue(member({ id: '42' }));
        const { container } = renderNew();

        await fillValidUser(user);
        const photo = new File(['x'], 'ana.png', { type: 'image/png' });
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            photo,
        );
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(create).toHaveBeenCalledWith({
            name: 'Ana Lima',
            email: 'ana@clinica.test',
            password: 'Clinica2026!',
            role: 'physiotherapist',
            status: 1,
            document: '52998224725',
        });
        expect(uploadPhoto).toHaveBeenCalledWith('42', photo);
        expect(toastSuccess).toHaveBeenCalledWith(
            'Usuário criado com sucesso.',
        );
        expect(
            screen.queryByRole('dialog', {
                name: /confirme a troca de senha/i,
            }),
        ).not.toBeInTheDocument();
    });

    it('foto acima de 2 MB ou de tipo que o backend não aceita é recusada antes de criar', async () => {
        const user = userEvent.setup({ applyAccept: false });
        create.mockResolvedValue(member({ id: '42' }));
        const { container } = renderNew();
        const input = () =>
            container.querySelector<HTMLInputElement>('input[type="file"]')!;

        await user.upload(
            input(),
            new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'grande.png', {
                type: 'image/png',
            }),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'A foto pode ter até 2 MB.',
        );
        expect(
            screen.queryByRole('button', { name: 'Remover foto' }),
        ).toBeNull();

        await user.upload(
            input(),
            new File(['x'], 'foto.gif', { type: 'image/gif' }),
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Use uma foto JPG, PNG ou WebP.',
        );

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('trocar a foto libera a prévia anterior, e sair da tela libera a atual', async () => {
        const user = userEvent.setup();
        const revoke = vi.spyOn(URL, 'revokeObjectURL');
        const { container, unmount } = renderNew();
        const input = () =>
            container.querySelector<HTMLInputElement>('input[type="file"]')!;

        await user.upload(
            input(),
            new File(['a'], 'a.png', { type: 'image/png' }),
        );
        const first = (
            container.querySelector('aside img') as HTMLImageElement
        ).getAttribute('src');
        await user.upload(
            input(),
            new File(['b'], 'b.png', { type: 'image/png' }),
        );
        const second = (
            container.querySelector('aside img') as HTMLImageElement
        ).getAttribute('src');

        expect(revoke).toHaveBeenCalledWith(first);
        unmount();
        expect(revoke).toHaveBeenCalledWith(second);
        revoke.mockRestore();
    });

    it('sem foto, não chama o envio de foto', async () => {
        const user = userEvent.setup();
        create.mockResolvedValue(member({ id: '42' }));
        renderNew();

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('foto que falha depois de criar avisa e volta para a lista', async () => {
        const user = userEvent.setup();
        create.mockResolvedValue(member({ id: '42' }));
        uploadPhoto.mockRejectedValue(new Error('falhou'));
        const { container } = renderNew();

        await fillValidUser(user);
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'ana.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(toastWarning).toHaveBeenCalledWith(
            expect.stringMatching(/criado, mas a foto não foi enviada/i),
        );
    });

    it('422 do backend aparece no campo e a tela não sai do cadastro', async () => {
        const user = userEvent.setup();
        create.mockRejectedValue({
            response: {
                status: 422,
                data: {
                    message: 'E-mail já está em uso.',
                    errors: { email: ['E-mail já está em uso.'] },
                },
            },
        });
        renderNew();

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('E-mail já está em uso.'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('E-mail')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(screen.queryByText('Lista de usuários')).toBeNull();
        expect(
            screen.getByRole('heading', { name: 'Novo usuário' }),
        ).toBeInTheDocument();
        // A mensagem vai para o campo, não repete num toast.
        expect(toastError).not.toHaveBeenCalled();
    });

    it('422 sem campo conhecido vai para o toast, para não sumir', async () => {
        const user = userEvent.setup();
        create.mockRejectedValue({
            response: {
                status: 422,
                data: {
                    message: 'Limite de usuários do plano atingido.',
                    errors: { plan: ['Limite de usuários do plano atingido.'] },
                },
            },
        });
        renderNew();

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        await vi.waitFor(() =>
            expect(toastError).toHaveBeenCalledWith(
                'Limite de usuários do plano atingido.',
            ),
        );
        expect(screen.queryByText('Lista de usuários')).toBeNull();
    });

    it('422 em campo que a tela não desenha vai para o toast junto do campo mostrado', async () => {
        const user = userEvent.setup();
        create.mockRejectedValue({
            response: {
                status: 422,
                data: {
                    message: 'Dados inválidos.',
                    errors: {
                        email: ['O email já está em uso.'],
                        status: ['Situação inválida.'],
                    },
                },
            },
        });
        renderNew();

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        expect(
            await screen.findByText('O email já está em uso.'),
        ).toBeInTheDocument();
        expect(toastError).toHaveBeenCalledWith('Situação inválida.');
    });

    it('enquanto cria, o botão fica ocupado e não envia duas vezes', async () => {
        const user = userEvent.setup();
        create.mockReturnValue(new Promise(() => {}));
        renderNew();

        await fillValidUser(user);
        await user.click(screen.getByRole('button', { name: 'Criar usuário' }));

        const busy = await screen.findByRole('button', { name: 'Criando…' });
        expect(busy).toBeDisabled();
        await user.click(busy);
        expect(create).toHaveBeenCalledTimes(1);
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
