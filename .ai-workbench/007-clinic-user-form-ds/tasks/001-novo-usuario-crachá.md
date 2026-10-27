# Cadastro de usuário no Crachá ao vivo

**Tipo:** História
**Plano:** `../plans/clinic-user-form-ds.md`
**Issue:** ainda não criada

## Descrição

O cadastro de usuário da clínica (`/clinica/usuarios/novo`) ainda abre só a
tela v1. A edição já tem o protótipo A (“Crachá ao vivo”) em
desenvolvimento: formulário à esquerda e, à direita, como a pessoa aparece
na agenda, no cartão e no PDF. Esta fatia liga o cadastro a essa mesma
tela, no modo criar: campos vazios, prévia com placeholders, senha
obrigatória sem código por e-mail, e criar em stub (nada grava).

## O que construir

- **Tela:** a rota de cadastro de usuário da clínica, no DS v2 (só
  componentes `Ds*` e tokens `--ds-*`), dentro do `ClinicLayout`, com
  rolagem no próprio contêiner. Em desenvolvimento, a variante A é o
  padrão; `?variant=O` mostra a v1. Em modo teste o interruptor
  desliga e a v1 permanece, como na edição.
- **Modo criar** no layout já aprovado da edição (não copiar a tela
  inteira): título “Novo usuário”, voltar para a lista, CTA “Criar
  usuário”. Campos vazios: nome, e-mail, senha e confirmação, documento
  (tipo padrão CPF), função e situação (padrão ativo), foto.
- **Prévia:** a mesma coluna direita da edição. Sem selo “Mestre”, sem
  números de carga, sem “desde …”. Nome vazio → “Nome do profissional”;
  foto vazia → avatar genérico; documento vazio → “Sem documento”. O
  crachá e as prévias atualizam enquanto se digita.
- **Senha:** obrigatória + confirmação, mínimo de 8 caracteres, mesmo
  indicador de força da edição. Sem modal de código. O botão de criar
  não fica desabilitado por “nada alterado”; validação do esquema de
  novo usuário decide se passa.
- **Integrações:** Google Agenda não aparece no cadastro.
- **Persistência:** stub. Toast deixando claro que nada foi gravado.
  Sem POST, sem upload, sem redirecionar para a lista fingindo sucesso.
- **Permissão:** só administrador (a rota já recusa os outros papéis).
  Sem migration, sem endpoint novo, sem Policy nova. Isolamento: esta
  fatia não lê nem grava usuário de outra clínica.

## Critérios de Aceite

- [x] Em desenvolvimento, `/clinica/usuarios/novo` abre o Crachá ao vivo (variante A). `?variant=O` mostra a v1.
- [x] O cabeçalho diz “Novo usuário”; voltar e cancelar levam à lista de usuários.
- [x] Os campos começam vazios (documento em CPF, situação ativa); função e situação aparecem (só admin chega aqui).
- [x] Com nome, foto ou documento vazios, a prévia usa os placeholders combinados; ao digitar, crachá, agenda, cartão e PDF acompanham.
- [x] Senha e confirmação são obrigatórias; menos de 8 caracteres ou senhas diferentes mostram erro; o indicador de força aparece.
- [x] Submeter o cadastro válido **não** abre o modal de código e **não** chama a API de criar nem de foto; o toast deixa claro que o protótipo não gravou (teste).
- [x] Google Agenda não aparece no cadastro (teste).
- [x] Fisioterapeuta ou secretário(a) que abre `/clinica/usuarios/novo` continua sendo mandado ao painel (comportamento já da rota).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (cadastro não lê outro id e não grava; conferir no smoke que nada nasceu no banco).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/user-editar-cadastro`
- **Exemplo no código:** o protótipo da edição (`UserEditPrototype`, `VariantA`, hook do formulário) e o interruptor da própria `UserEditPage` / `UserListPage`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`
- O esquema Zod de novo usuário já existe em `application/`; reutilize. O hook do protótipo hoje é só edição: ele ganha o modo `create` nesta fatia (a fatia 002 cobre a regressão da edição).
- Testes importam o protótipo ou o hook direto: o interruptor desliga em `MODE=test`.

## Como testar na mão

1. `fisio-app url` e entrar na Clínica Cleverton como admin.
2. Abrir `/clinica/usuarios/novo`: Crachá ao vivo, campos vazios, placeholders à direita, sem Google Agenda.
3. Preencher nome, foto, função fisioterapeuta e CREFITO: a prévia e a assinatura do PDF mudam. Trocar para secretário(a): a assinatura some.
4. Tentar criar sem senha: erro. Com senha fraca, o indicador mostra. Com senhas iguais e o resto válido: toast de stub, a lista e o banco não ganham usuário.
5. `?variant=O` mostra a v1. Voltar para A.
6. Entrar como fisioterapeuta: `/clinica/usuarios/novo` manda ao painel.
7. Conferir celular (~375px) e tema escuro.
