# ADR: Quem troca a senha de quem na clínica, e a troca pede código por e-mail

## Contexto

O protótipo da edição de usuário no design system v2 (`/clinica/usuarios/:id/editar`, pasta `pages/clinic/user/user-edit-prototype/`) foi aprovado na variante A, "Crachá ao vivo". Junto com ele, o produto definiu regras para a troca de senha que o sistema não segue hoje.

Como está hoje:

- `PUT /api/clinic/users/{user}` aceita `password` (`UpdateClinicUserRequest`), e o `ClinicUserService::update` só barra quem não é administrador editando outra pessoa. Qualquer administrador troca a senha de qualquer usuário da clínica, inclusive a de outro administrador e a do mestre.
- O `ClinicUserPolicy::update` deixa só a própria pessoa, mas o `Gate::before` do `ClinicServiceProvider` devolve `true` para todo administrador. Uma regra nova escrita só na Policy seria ignorada para administradores.
- A troca de senha não pede confirmação nenhuma: quem tem a sessão aberta troca a senha na hora.
- O sistema não tem verificação em duas etapas. Existe a coluna `two_factor_confirmed_at` em `clinic_users`, sem nenhum fluxo; nenhuma tela deve oferecer isso.

## Decisão

### Quem pode trocar a senha

| Quem está logado | Própria senha | Fisioterapeuta ou secretário(a) | Outro administrador | Mestre |
|---|---|---|---|---|
| Mestre | sim | sim | sim | (é ele mesmo) |
| Administrador | sim | sim | **não** | **não** |
| Fisioterapeuta ou secretário(a) | sim | não | não | não |

- A senha de outra pessoa, só administrador troca.
- A senha de um administrador, só o mestre troca (além do próprio administrador).
- A senha do mestre, ninguém além dele troca.

A regra fica no backend, numa verificação explícita do service (ou numa ability própria, como `updatePassword`, que o `Gate::before` não libere sozinho). O front esconde o campo e mostra o motivo, mas não decide. O protótipo tinha a mesma tabela em `passwordLockReason` (`user-edit-prototype/form.ts`, removido na tarefa 004 da feature 007; está no commit `60f682d`); na tela real, ela vai para `application/clinic/permissions.ts`, com teste.

### A troca pede um código por e-mail

1. Quem salva uma senha nova recebe um código de 6 dígitos no **e-mail de quem está logado**: no próprio perfil, o da pessoa; quando o administrador ou o mestre troca a senha de outra conta, o do administrador ou do mestre, não o da pessoa.
2. O código vale 10 minutos, pode ser reenviado depois de 30 segundos e aceita um número limitado de tentativas (sugestão: 5). O backend guarda só o hash, a validade e as tentativas, e invalida o código depois de usado.
3. Sugestão de contrato: `POST /api/clinic/users/{user}/password-code` gera e envia o código para quem está logado (com rate limit); o `PUT /api/clinic/users/{user}` só aceita `password` junto com um `password_code` válido, emitido para aquele usuário logado e aquele usuário alvo.
4. O resto do formulário (nome, documento, função, situação) continua salvando sem código.

## Consequências

- Benefícios:
  - Uma sessão aberta e esquecida não basta para trocar a senha de alguém.
  - A conta do mestre, que edita os dados da clínica, não pode ser tomada por outro administrador.
- Custos:
  - Endpoint novo, envio de e-mail (fila) e tabela ou cache para os códigos.
  - Um administrador que não é o mestre não consegue mais destravar a conta de outro administrador; isso passa a depender do mestre.
- Regras que agentes devem preservar:
  - Não depender da Policy para essa regra enquanto o `Gate::before` liberar tudo para administrador.
  - O código vai sempre para quem está logado, nunca para o e-mail do usuário alvo quando são pessoas diferentes.
  - Testes de feature: mestre troca a senha de administrador (passa); administrador troca a de outro administrador e a do mestre (403); fisioterapeuta troca a de outra pessoa (403); senha sem código ou com código vencido, errado ou de outro usuário (422); código de outra clínica (não serve).
  - Nenhuma tela oferece verificação em duas etapas enquanto ela não existir no backend.

## Alternativas descartadas

- Mandar o código para o e-mail do usuário alvo: o administrador ficaria dependendo da pessoa para trocar a senha que ela mesma esqueceu.
- Pedir a senha atual em vez de código: quem troca a senha de outra pessoa não sabe a senha dela, e a senha atual não protege uma sessão já aberta.
- Deixar qualquer administrador trocar a senha do mestre, como hoje: um administrador poderia tomar a conta dona da clínica.

## Situação (2026-10-20)

A edição de usuário v2 virou a tela de verdade (feature `007-clinic-user-form-ds`, tarefa 004) **sem** este ADR: por decisão do usuário, a senha continua como na v1 (quem chega à edição troca direto, sem código e sem a tabela acima). A decisão deste ADR segue valendo como o destino; falta o backend (regra no service, endpoint do código, fila de e-mail) e, depois, a tela.

## Em aberto

- O mestre trocar a própria senha foi tratado como permitido ("ninguém além dele"). Se o produto quiser outro caminho para o mestre (por exemplo, só pelo "esqueci minha senha"), muda só a primeira linha da tabela.
