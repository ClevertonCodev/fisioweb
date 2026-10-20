/**
 * "Crachá ao vivo": o formulário à esquerda e, à direita, como
 * a pessoa aparece no sistema, mudando enquanto se digita: o crachá, a
 * consulta na agenda, o cartão do paciente e a assinatura do PDF. Mostra
 * por que nome, foto e CREFITO importam. Serve ao cadastro e à edição
 * (f.mode); com nome, foto ou documento vazios, a prévia usa placeholders.
 */
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DsBadge, DsButton, dsCn } from '@/components/ds';

import { DOCUMENT_KIND_LABEL } from './form';
import {
    DocumentFields,
    EmailField,
    GoogleRow,
    NameField,
    PasswordFields,
    PhotoActions,
    PhotoAvatar,
    RoleCards,
    SaveBar,
    SectionTitle,
    StatusSwitch,
    type UserFormLayoutProps,
} from './parts';
import { ROLE_META } from './roles';

/** Nome na prévia enquanto o campo está vazio. */
export const NAME_PLACEHOLDER = 'Nome do profissional';

const card =
    'rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs sm:p-6';

export function UserFormLayout(props: UserFormLayoutProps) {
    const { f, canManageUsers, isOwnProfile, roleLocked, backTo } = props;
    const navigate = useNavigate();
    const creating = f.mode === 'create';

    return (
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <form
                onSubmit={f.submit}
                noValidate
                className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6 px-4 pt-6 pb-44 sm:px-6 sm:pt-8 sm:pb-28"
            >
                <header className="flex items-center gap-3">
                    <DsButton
                        variant="tertiary"
                        iconPosition="only"
                        icon={<ArrowLeft />}
                        label="Voltar"
                        onClick={() => navigate(backTo)}
                    />
                    <div>
                        <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                            {creating
                                ? 'Novo usuário'
                                : isOwnProfile
                                  ? 'Meu perfil'
                                  : 'Editar usuário'}
                        </h1>
                        <p className="text-ds-caption text-ds-content-secondary sm:text-ds-body-sm">
                            Na prévia, como{' '}
                            {creating
                                ? 'a pessoa vai aparecer'
                                : isOwnProfile
                                  ? 'você aparece'
                                  : 'a pessoa aparece'}{' '}
                            para a clínica e os pacientes.
                        </p>
                    </div>
                </header>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* Formulário */}
                    <div className="flex min-w-0 flex-1 flex-col gap-6">
                        <section className={card}>
                            <SectionTitle
                                title="Identidade"
                                hint="Nome e foto aparecem na agenda, nos cartões e nos PDFs. A foto fica no crachá: clique nela para trocar."
                            />
                            <div className="flex flex-col gap-5">
                                <PhotoActions f={f} />
                                <NameField f={f} />
                                <EmailField f={f} />
                            </div>
                        </section>

                        <section className={card}>
                            <SectionTitle
                                title="Registro profissional"
                                hint="Quem atende assina com o CREFITO; CPF ou CNPJ só identificam."
                            />
                            <DocumentFields f={f} />
                        </section>

                        {canManageUsers && (
                            <section className={card}>
                                <SectionTitle
                                    title="Função e acesso"
                                    hint="O que a pessoa pode fazer no sistema."
                                />
                                <div className="flex flex-col gap-5">
                                    <RoleCards f={f} disabled={roleLocked} />
                                    <StatusSwitch f={f} disabled={roleLocked} />
                                </div>
                            </section>
                        )}

                        <section className={card}>
                            <SectionTitle
                                title="Senha"
                                hint={
                                    creating
                                        ? 'É com ela que a pessoa entra no sistema.'
                                        : 'Deixe em branco para manter a atual.'
                                }
                            />
                            <PasswordFields f={f} />
                        </section>

                        {/* No cadastro ainda não há perfil para conectar. */}
                        {!creating && (
                            <section className={card}>
                                <SectionTitle title="Integrações" />
                                <GoogleRow isOwnProfile={isOwnProfile} />
                            </section>
                        )}
                    </div>

                    {/* Como aparece */}
                    <aside
                        aria-label="Pré-visualização"
                        className="order-first flex flex-col gap-4 lg:sticky lg:top-6 lg:order-none lg:w-[360px] lg:shrink-0"
                    >
                        <Badge {...props} />
                        <Appearances {...props} />
                    </aside>
                </div>

                {/* Barra de salvar */}
                <SaveBar>
                    <div className="flex items-center gap-3">
                        <p className="mr-auto min-w-0 truncate text-ds-caption text-ds-content-secondary">
                            {creating
                                ? 'Confira a prévia antes de criar.'
                                : f.changes.length === 0
                                  ? 'Nada alterado'
                                  : `${f.changes.length} ${f.changes.length === 1 ? 'alteração' : 'alterações'}: ${f.changes.map((c) => c.label.toLowerCase()).join(', ')}`}
                        </p>
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={() => navigate(backTo)}
                        />
                        {/* No cadastro não há base: a validação decide. */}
                        <DsButton
                            type="submit"
                            label={
                                creating
                                    ? f.submitting
                                        ? 'Criando…'
                                        : 'Criar usuário'
                                    : 'Salvar'
                            }
                            loading={f.submitting}
                            disabled={!creating && f.changes.length === 0}
                        />
                    </div>
                </SaveBar>
            </form>
        </div>
    );
}

function Badge({ user, f }: UserFormLayoutProps) {
    const v = f.values;
    const inactive = v.status === '0';
    const crefito = v.documentKind === 'crefito' && v.document;
    return (
        <div
            className={dsCn(
                'relative mx-auto w-full max-w-[300px] overflow-hidden rounded-ds-2xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-md transition-[filter]',
                inactive && 'grayscale',
            )}
        >
            {/* Furo do cordão */}
            <span className="absolute top-3 left-1/2 z-[1] h-2 w-12 -translate-x-1/2 rounded-ds-pill bg-ds-surface-body" />
            <div className="h-24 bg-[image:var(--ds-gradient-brand)]" />
            <div className="-mt-12 flex flex-col items-center gap-2 px-6 pb-6 text-center">
                <PhotoAvatar
                    f={f}
                    name={v.name}
                    size={96}
                    className="ring-4 ring-ds-surface-default"
                />
                <p
                    className={dsCn(
                        'mt-1 text-ds-h4 leading-tight font-semibold break-words',
                        !v.name && 'text-ds-content-muted',
                    )}
                >
                    {v.name || NAME_PLACEHOLDER}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                    {v.role ? (
                        <DsBadge variant="primary">
                            {ROLE_META[v.role].label}
                        </DsBadge>
                    ) : (
                        <DsBadge>Sem função</DsBadge>
                    )}
                    {user?.mestre === 1 && (
                        <DsBadge variant="new">Mestre</DsBadge>
                    )}
                </div>
                <p className="font-ds-mono text-ds-caption text-ds-content-secondary">
                    {crefito
                        ? `CREFITO ${v.document}`
                        : v.document
                          ? `${DOCUMENT_KIND_LABEL[v.documentKind]} ${v.document}`
                          : 'Sem documento'}
                </p>
                <p className="text-ds-micro tracking-[0.08em] text-ds-content-muted uppercase">
                    IVS Fisioterapia e Saúde
                    {user?.createdAt &&
                        ` · desde ${new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                </p>
            </div>
            {inactive && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-ds-md border-2 border-ds-status-danger-content px-3 py-1 text-ds-body-sm font-bold tracking-[0.12em] text-ds-status-danger-content uppercase">
                    Desativada
                </span>
            )}
        </div>
    );
}

function Appearances({ f }: UserFormLayoutProps) {
    const v = f.values;
    // Como a agenda chama a pessoa: o primeiro nome, com "Dr."/"Dra." junto.
    const words = v.name.trim().split(/\s+/);
    const first =
        (/^dra?\.?$/i.test(words[0] ?? '')
            ? words.slice(0, 2).join(' ')
            : words[0]) || NAME_PLACEHOLDER;
    const name = v.name || NAME_PLACEHOLDER;
    const crefito =
        v.documentKind === 'crefito' && v.document ? v.document : null;
    // Assina quem atende: fisioterapeuta, ou administrador com CREFITO.
    const role = v.role;
    const signs = role === 'physiotherapist' || (role === 'admin' && !!crefito);
    return (
        <div className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
            <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                Onde aparece
            </p>

            <figure className="flex flex-col gap-1.5">
                <figcaption className="text-ds-caption text-ds-content-secondary">
                    Na agenda
                </figcaption>
                <div className="flex items-center gap-2 rounded-ds-md border-l-4 border-ds-status-info-content bg-ds-status-info-surface px-3 py-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-ds-body-xs font-medium">
                            09:00 · Sessão de Pilates
                        </p>
                        <p className="truncate text-ds-caption text-ds-content-secondary">
                            Maria Souza · com {first}
                        </p>
                    </div>
                </div>
            </figure>

            <figure className="flex flex-col gap-1.5">
                <figcaption className="text-ds-caption text-ds-content-secondary">
                    No cartão do paciente
                </figcaption>
                <div className="flex items-center gap-3 rounded-ds-md border border-ds-border-subtle px-3 py-2">
                    <span className="flex size-8 items-center justify-center rounded-ds-full bg-ds-surface-subtle text-ds-caption font-semibold">
                        MS
                    </span>
                    <div className="min-w-0">
                        <p className="text-ds-body-xs font-medium">
                            Maria Souza
                        </p>
                        <p className="truncate text-ds-caption text-ds-content-secondary">
                            por {name}
                        </p>
                    </div>
                </div>
            </figure>

            {!signs && (
                <p className="rounded-ds-md bg-ds-surface-subtle px-3 py-2 text-ds-caption text-ds-content-muted">
                    {!role
                        ? 'Escolha a função para ver se a pessoa assina evoluções e programas.'
                        : role === 'secretary'
                          ? 'Secretário(a) não assina evoluções nem programas.'
                          : 'Administrador só assina com CREFITO. Informe o registro em Registro profissional.'}
                </p>
            )}
            {signs && role && (
                <figure className="flex flex-col gap-1.5">
                    <figcaption className="text-ds-caption text-ds-content-secondary">
                        Na assinatura do PDF
                    </figcaption>
                    <div className="rounded-ds-md border border-ds-border-subtle bg-ds-white px-4 pt-6 pb-3 text-center text-ds-gray-100">
                        <p className="font-[cursive] text-ds-body-lg italic opacity-70">
                            {name}
                        </p>
                        <div className="mx-auto mt-1 mb-1.5 h-px w-4/5 bg-ds-gray-60" />
                        <p className="text-ds-caption font-semibold">{name}</p>
                        <p
                            className={dsCn(
                                'text-ds-micro',
                                crefito
                                    ? 'text-ds-gray-80'
                                    : 'text-ds-danger-120',
                            )}
                        >
                            {ROLE_META[role].label}
                            {crefito
                                ? ` · CREFITO ${crefito}`
                                : ' · sem CREFITO informado'}
                        </p>
                    </div>
                </figure>
            )}
        </div>
    );
}
