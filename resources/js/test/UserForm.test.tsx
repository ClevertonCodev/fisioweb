import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { UserEditPage } from '@/pages/clinic/user/UserEditPage';
import { UserNewPage } from '@/pages/clinic/user/UserNewPage';
import { routerFutureFlags } from '@/test/browser-router';

const getById = vi.fn();
const create = vi.fn();
const update = vi.fn();
const uploadPhoto = vi.fn();
const deletePhoto = vi.fn();
const connectGoogle = vi.fn();
const googleStatusEnabled = vi.fn();
const disconnectGoogle = vi.fn();
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
        deletePhoto: (...args: unknown[]) => deletePhoto(...args),
    },
}));

// Programas, pacientes e agenda não importam aqui.
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
    useGoogleCalendarStatus: (enabled?: boolean) => {
        googleStatusEnabled(enabled);
        return { data: googleStatus, isLoading: false };
    },
    useConnectGoogleCalendar: () => ({
        mutate: (...args: unknown[]) => connectGoogle(...args),
        isPending: false,
    }),
    useDisconnectGoogleCalendar: () => ({
        mutateAsync: (...args: unknown[]) => disconnectGoogle(...args),
        isPending: false,
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

    it('cada cartão de função tem o nome acessível só do cargo', () => {
        renderNew();

        const group = screen.getByRole('radiogroup', { name: 'Função' });
        expect(
            within(group).getByRole('radio', { name: 'Administrador' }),
        ).toBeInTheDocument();
        expect(
            within(group).getByRole('radio', { name: 'Fisioterapeuta' }),
        ).toBeInTheDocument();
        expect(
            within(group).getAllByRole('radio', { name: /fisioterapeuta/i }),
        ).toHaveLength(1);
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

function renderEdit(target: ClinicUserSummary) {
    getById.mockResolvedValue(target);
    return renderEditRaw(target.id);
}

function renderEditRaw(id: string) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[`/clinica/usuarios/${id}/editar`]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/usuarios/:id/editar"
                        element={<UserEditPage />}
                    />
                    <Route
                        path="/clinica/usuarios"
                        element={<p>Lista de usuários</p>}
                    />
                    <Route path="/clinica" element={<p>Painel</p>} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('edição de usuário (tela de verdade)', () => {
    it('carrega o usuário sem barra de protótipo; sem alteração, "Nada alterado" e Salvar desabilitado', async () => {
        const user = userEvent.setup();
        renderEdit(member());

        expect(
            await screen.findByRole('heading', { name: 'Editar usuário' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome')).toHaveValue('Bruno Reis');
        expect(screen.getByText('Nada alterado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
        expect(
            screen.queryByRole('group', {
                name: 'Trocar variante do protótipo',
            }),
        ).toBeNull();
        // Sem os contadores do protótipo (decisão de 2026-10-20).
        expect(preview().queryByText('Pacientes')).toBeNull();

        await user.type(screen.getByLabelText('Nome'), ' Jr');

        expect(screen.getByText('1 alteração: nome')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
        expect(getById).toHaveBeenCalledWith('7');
    });

    it('admin salva pela API com função e situação, sem senha vazia, e volta para a lista', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member({ name: 'Bruno Reis Jr' }));
        renderEdit(member());

        await user.type(await screen.findByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith('7', {
            name: 'Bruno Reis Jr',
            email: 'bruno@clinica.test',
            document: '52998224725',
            role: 'physiotherapist',
            status: 1,
        });
        expect(toastSuccess).toHaveBeenCalledWith(
            'Usuário atualizado com sucesso.',
        );
        expect(uploadPhoto).not.toHaveBeenCalled();
        expect(deletePhoto).not.toHaveBeenCalled();
    });

    it('no próprio perfil, quem não é admin não manda função nem situação e volta para o painel', async () => {
        const user = userEvent.setup();
        authUser = { ...authUser, id: 7, role: 'physiotherapist' };
        update.mockResolvedValue(member());
        renderEdit(member());

        expect(
            await screen.findByRole('heading', { name: 'Meu perfil' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('radiogroup', { name: 'Função' })).toBeNull();
        await user.type(screen.getByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(await screen.findByText('Painel')).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith('7', {
            name: 'Bruno Reis Jr',
            email: 'bruno@clinica.test',
            document: '52998224725',
        });
    });

    it('senha nova salva direto pela API, sem código por e-mail', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        renderEdit(member());

        await user.type(
            await screen.findByLabelText('Nova senha'),
            'Clinica2026!',
        );
        await user.type(
            screen.getByLabelText('Confirmar nova senha'),
            'Clinica2026!',
        );
        expect(screen.queryByText(/enviamos um código/i)).toBeNull();
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith(
            '7',
            expect.objectContaining({ password: 'Clinica2026!' }),
        );
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('foto nova é enviada depois de salvar', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        uploadPhoto.mockResolvedValue(member());
        const { container } = renderEdit(member());

        await screen.findByText('Nada alterado');
        const photo = new File(['x'], 'bruno.png', { type: 'image/png' });
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            photo,
        );
        expect(screen.getByText('1 alteração: foto')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(uploadPhoto).toHaveBeenCalledWith('7', photo);
    });

    it('foto removida é apagada depois de salvar', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        deletePhoto.mockResolvedValue(member());
        renderEdit(member({ photoUrl: 'https://cdn.test/bruno.png' }));

        await user.click(
            await screen.findByRole('button', { name: 'Remover foto' }),
        );
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(deletePhoto).toHaveBeenCalledWith('7');
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('422 do backend aparece no campo e a tela não sai da edição', async () => {
        const user = userEvent.setup();
        update.mockRejectedValue({
            response: {
                status: 422,
                data: { errors: { email: ['O email já está em uso.'] } },
            },
        });
        renderEdit(member());

        await user.type(await screen.findByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('O email já está em uso.'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Lista de usuários')).toBeNull();
        expect(toastError).not.toHaveBeenCalled();
    });

    it('Google Agenda: no próprio perfil conecta e desconecta pela API; em outra pessoa, só ela conecta', async () => {
        const user = userEvent.setup();
        authUser = { ...authUser, id: 7, role: 'physiotherapist' };
        const own = renderEdit(member());

        await user.click(
            await screen.findByRole('button', { name: 'Conectar' }),
        );
        expect(connectGoogle).toHaveBeenCalledWith(
            '/clinica/usuarios/7/editar',
        );
        own.unmount();

        googleStatus = {
            connected: true,
            connectedAt: new Date(Date.now() - 86_400_000).toISOString(),
        };
        disconnectGoogle.mockResolvedValue(undefined);
        const connected = renderEdit(member());
        expect(await screen.findByText(/^Conectado em/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Desconectar' }));
        expect(disconnectGoogle).toHaveBeenCalled();
        connected.unmount();

        authUser = { ...authUser, id: 1, role: 'admin' };
        renderEdit(member());
        expect(
            await screen.findByText(
                'Só a própria pessoa conecta, no perfil dela.',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /conectar/i })).toBeNull();
    });

    it('no mestre, função e situação ficam travadas', async () => {
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
    });

    it('mestre que a v1 deixou inativo abre ativo e salvar o reativa', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        renderEdit(member({ id: '2', role: 'admin', mestre: 1, status: 0 }));

        await screen.findByText(
            'Este é o mestre da clínica: a função fica administrador.',
        );
        expect(screen.getByRole('switch')).toBeChecked();
        expect(
            screen.getByText(/estava desativado; salvar reativa a conta/i),
        ).toBeInTheDocument();
        // Só a reativação já conta como alteração: nada de mexer no nome.
        expect(screen.getByText('1 alteração: situação')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith(
            '2',
            expect.objectContaining({ status: 1 }),
        );
    });

    it('usuário comum desativado continua desativado: abrir não reativa', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        renderEdit(member({ status: 0 }));

        expect(await screen.findByText('Nada alterado')).toBeInTheDocument();
        expect(screen.getByRole('switch')).not.toBeChecked();
        expect(screen.getByText('Conta desativada')).toBeInTheDocument();
        await user.type(screen.getByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(update).toHaveBeenCalledWith(
            '7',
            expect.objectContaining({ status: 0 }),
        );
    });

    it('apagar o nome mostra os placeholders do cadastro', async () => {
        const user = userEvent.setup();
        renderEdit(member({ photoUrl: undefined }));

        await user.clear(await screen.findByLabelText('Nome'));

        expect(
            preview().getAllByText('Nome do profissional').length,
        ).toBeGreaterThan(1);
        expect(preview().queryByText('Sem nome')).toBeNull();
        const avatar = screen.getAllByRole('button', {
            name: 'Trocar foto',
        })[0];
        expect(avatar.querySelector('.lucide-user-round')).not.toBeNull();
    });

    it('usuário que não carrega mostra "não encontrado"', async () => {
        getById.mockRejectedValueOnce(new Error('404'));
        renderEditRaw('99');

        expect(
            await screen.findByText('Usuário não encontrado'),
        ).toBeInTheDocument();
    });

    it('volta do OAuth com ?google=connected avisa e limpa a URL', async () => {
        authUser = { ...authUser, id: 7, role: 'physiotherapist' };
        window.history.pushState(
            {},
            '',
            '/clinica/usuarios/7/editar?google=connected',
        );
        renderEdit(member());

        await screen.findByRole('heading', { name: 'Meu perfil' });
        expect(toastSuccess).toHaveBeenCalledWith(
            'Google Calendar conectado com sucesso!',
        );
        expect(window.location.search).toBe('');
        window.history.pushState({}, '', '/');
    });

    it('em outra pessoa não busca o status do Google de quem está logado', async () => {
        renderEdit(member());

        await screen.findByText('Só a própria pessoa conecta, no perfil dela.');
        expect(googleStatusEnabled).toHaveBeenCalled();
        expect(googleStatusEnabled).not.toHaveBeenCalledWith(true);
    });

    it('escolher e depois remover a foto de quem não tinha foto não apaga nada', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        const { container } = renderEdit(member({ photoUrl: undefined }));

        await screen.findByText('Nada alterado');
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'b.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Remover foto' }));
        await user.type(screen.getByLabelText('Nome'), ' Jr');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        expect(deletePhoto).not.toHaveBeenCalled();
        expect(uploadPhoto).not.toHaveBeenCalled();
    });

    it('foto que falha depois de salvar avisa e volta para a lista', async () => {
        const user = userEvent.setup();
        update.mockResolvedValue(member());
        uploadPhoto.mockRejectedValue({ response: { status: 422 } });
        const { container } = renderEdit(member());

        await screen.findByText('Nada alterado');
        await user.upload(
            container.querySelector<HTMLInputElement>('input[type="file"]')!,
            new File(['x'], 'b.png', { type: 'image/png' }),
        );
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(
            await screen.findByText('Lista de usuários'),
        ).toBeInTheDocument();
        // Um aviso só: o do hook da foto (os dados já foram salvos).
        expect(toastError).toHaveBeenCalledTimes(1);
        expect(toastError).toHaveBeenCalledWith('Erro ao enviar a foto.');
        expect(toastWarning).not.toHaveBeenCalled();
    });
});
