# Cadastro e edição de usuário da clínica no DS v2 (protótipo)

Data: 2026-10-19
Fonte: conversa de refinamento de 2026-10-19 (skill `refinar`). Protótipo A
da edição já aprovado (“Crachá ao vivo”). ADR 019 descreve a troca de senha
com código por e-mail, mas fica fora desta entrega.

## Problema

O administrador da clínica cria e edita usuários em telas v1 (shadcn). A
edição no design system v2 já existe em desenvolvimento, na variante A
(“Crachá ao vivo”): formulário à esquerda e, à direita, como a pessoa
aparece na agenda, no cartão do paciente e no PDF. Essa tela carrega dados
reais, mas o salvar ainda é stub.

O cadastro (`/clinica/usuarios/novo`) não tem essa tela. Quem entra por
“Novo usuário” cai na v1, com outro layout, outro vocabulário e sem a
prévia ao vivo. Fica difícil julgar se o mesmo desenho serve para criar e
para editar, e o administrador não vê, enquanto preenche, o efeito do nome,
da foto, da função e do CREFITO.

## Solução

As duas rotas passam a usar a mesma tela do protótipo A em desenvolvimento
(`?variant=A` por padrão; `?variant=O` mostra a v1). A edição continua
igual: dados reais, salvar stub, código visual na troca de senha, Google
Agenda só no próprio perfil.

O cadastro é a mesma tela, com o formulário vazio. Enquanto o administrador
digita, o crachá e as prévias à direita atualizam; enquanto estiver vazio,
aparecem placeholders (“Nome do profissional”, avatar genérico). Senha e
confirmação são obrigatórias, com o mesmo indicador de força da edição, e
**não** pedem o modal de código (código é só troca, ADR 019). Criar é stub:
aviso de que nada foi gravado, sem POST.

Nenhum endpoint, migration ou Policy muda nesta entrega.

## Histórias de Usuário

1. Como administrador da clínica, quero abrir o cadastro de usuário e ver a mesma tela do “Crachá ao vivo” da edição, para não aprender dois desenhos.
2. Como administrador, quero o cadastro com campos vazios (nome, e-mail, documento, função, situação, senha e foto), para preencher uma pessoa nova do zero.
3. Como administrador, quero um título “Novo usuário” e um botão “Criar usuário”, para não confundir com a edição de alguém que já existe.
4. Como administrador, quero voltar do cadastro para a lista de usuários, para desistir sem perder o caminho.
5. Como administrador, quero ver à direita o crachá, a agenda, o cartão do paciente e a assinatura do PDF enquanto preencho, para entender por que nome, foto, função e CREFITO importam.
6. Como administrador, quero placeholders no crachá e nas prévias enquanto o nome, a foto ou o documento ainda estão vazios (“Nome do profissional”, avatar genérico, “Sem documento”), para a coluna direita não parecer quebrada.
7. Como administrador, quero que o crachá e as prévias mudem a cada letra (nome, função, documento, foto, situação), como na edição, para conferir o resultado antes de “criar”.
8. Como administrador, quero escolher a função em cartões (administrador, secretário(a), fisioterapeuta), para ver o que cada papel pode fazer.
9. Como administrador, quero criar a pessoa já ativa ou já inativa, para cadastrar alguém que ainda não deve entrar.
10. Como administrador, quero que senha e confirmação sejam obrigatórias no cadastro, para a conta nascer com acesso.
11. Como administrador, quero o mesmo indicador de força da senha da edição (fraca / razoável / boa / forte), para não escolher uma senha fraca sem perceber.
12. Como administrador, quero um aviso se as senhas não coincidirem ou tiverem menos de 8 caracteres, para corrigir antes de seguir.
13. Como administrador, **não** quero o modal de código por e-mail no cadastro, para não misturar “criar conta” com “trocar senha”.
14. Como administrador, quero escolher CPF, CNPJ ou CREFITO e ver a máscara correspondente, para o documento nascer no formato certo.
15. Como administrador, quero clicar na foto (ou no avatar vazio) para escolher uma imagem, para o crachá já mostrar a cara da pessoa.
16. Como administrador, **não** quero a seção de Google Agenda no cadastro, porque ainda não existe perfil para conectar.
17. Como administrador, quero clicar em “Criar usuário” com o formulário válido e ver um aviso de que o protótipo não gravou nada, para saber que estou no desenho, não no sistema real.
18. Como administrador, quero que “Criar usuário” **não** fique desabilitado só porque “nada foi alterado” (não há base para comparar), para conseguir enviar o cadastro vazio e ver os erros de validação, ou enviar o preenchido e ver o stub.
19. Como administrador, quero abrir a edição de um usuário existente e continuar vendo o Crachá ao vivo com os dados reais, para conferir que o cadastro novo não quebrou a edição.
20. Como administrador, quero, na edição, deixar a senha em branco para manter a atual, para não ser obrigado a trocar senha ao salvar nome ou documento.
21. Como administrador (ou mestre, conforme a tabela do ADR 019), quero, na edição, preencher uma senha nova e cair no modal de código enviado a **mim**, para o desenho da troca continuar igual ao que já foi aprovado.
22. Como administrador que **não** é o mestre, quero, na edição de outro administrador ou do mestre, ver o motivo pelo qual não posso trocar a senha, em vez do campo, para entender a trava.
23. Como mestre da clínica, quero que a minha função continue travada em administrador na edição, para ninguém me rebaixar pelo formulário.
24. Como fisioterapeuta ou secretário(a), quero abrir o **meu** perfil no Crachá ao vivo (sem função, sem situação, sem Google se não for o próprio — Google só no próprio), para atualizar nome, documento e senha sem ver o que só o administrador gerencia.
25. Como fisioterapeuta ou secretário(a), quero ser recusado ao abrir o cadastro de usuário (a rota já manda para o painel), para não cadastrar colega.
26. Como quem está no próprio perfil, quero ver o estado real do Google Agenda (conectar e desconectar continuam stub no protótipo), para saber se as consultas já vão para o Google.
27. Como quem está editando **outra** pessoa, quero ver que só ela conecta o Google no perfil dela, para não achar que posso ligar a agenda de outra conta.
28. Como desenvolvedor, quero `?variant=O` nas duas rotas para ver a v1, e `?variant=A` (padrão em desenvolvimento) para o Crachá ao vivo, para comparar os dois desenhos.
29. Como desenvolvedor, quero que os testes automatizados continuem vendo a v1 (o interruptor do protótipo desliga em modo teste), para a suíte não depender da barra flutuante.
30. Como clínica, quero que nada desta entrega grave usuário, senha ou foto de verdade, para um clique no protótipo não alterar o banco.

## Decisões de Implementação

**Donos e telas**

- O dado e a regra de usuário da clínica já são do módulo `Clinic` (Model,
  Policy, rotas do guard `clinic`). Esta feature **não** mexe no backend.
- Mudam só as páginas de cadastro e edição de usuário da área da clínica no
  SPA. A lista de usuários tem protótipo próprio e **não** entra nesta
  entrega.
- As duas telas são v2 no protótipo: só componentes `Ds*` e tokens `--ds-*`
  (skill `design-system`), dentro do `ClinicLayout`, com rolagem no
  contêiner da tela. A v1 (shadcn) permanece atrás de `?variant=O` e em
  modo teste.
- O interruptor de variante só liga em desenvolvimento e fora de teste, no
  mesmo padrão da lista e da edição de usuário. Padrão: variante A.

**Uma tela, dois modos**

- O layout aprovado (formulário + crachá ao vivo) ganha um modo
  `create` | `edit`. Cadastro e edição compartilham as peças; não se copia
  a variante A para uma pasta nova.
- O cadastro usa o esquema Zod já existente de **novo** usuário (senha
  obrigatória, função obrigatória, situação com padrão ativo). A edição
  continua no esquema de **editar** (senha opcional).
- O hook do protótipo, hoje só de edição, passa a aceitar os dois modos:
  no cadastro não há usuário carregado, não há “alterações em relação à
  base”, não há passo de código, e o envio sempre cai no stub de criar.
- Função e situação aparecem no cadastro (só administrador chega nessa
  rota). Na edição, continuam só quando quem está logado gerencia
  usuários; o mestre trava função e situação.

**Senha**

- Cadastro: senha + confirmação obrigatórias, indicador de força, sem
  modal de código.
- Edição: a tabela do ADR 019 já está no protótipo (`passwordLockReason`).
  Quem pode, troca; a troca abre o modal de código visual (nenhum e-mail
  sai). Quem não pode, vê o motivo. Essa tabela **não** vai ainda para
  `permissions` nem para o backend — isso é a implementação real do ADR
  019, fora desta entrega.

**Prévia**

- Cadastro e edição usam a mesma coluna direita. No cadastro: sem selo
  “Mestre”, sem números de pacientes/programas/semana, sem “desde …”.
  Nome vazio → “Nome do profissional”; foto vazia → avatar genérico;
  documento vazio → “Sem documento”; na agenda, o “com …” usa o primeiro
  nome ou o placeholder.
  Decisão de 2026-10-20: os mesmos placeholders valem na edição quando o
  nome é apagado (no lugar de “Sem nome”, “—” e “?”).
- Assinatura do PDF: a mesma regra da edição (fisioterapeuta assina;
  administrador só com CREFITO; secretário(a) não assina).

**Integrações**

- Seção Google Agenda só no modo `edit`. No cadastro, some. No próprio
  perfil, mostra o status real e os botões stub. Em outra pessoa, o texto
  de que só ela conecta.

**Persistência**

- Sem POST, PUT, upload de foto, job de e-mail ou tabela de código.
- Stub de criar: toast deixando claro que nada foi gravado. Não
  redireciona para a lista (redirecionar fingiria sucesso real); o
  formulário pode permanecer preenchido para o administrador continuar
  olhando a prévia.
- Stub de editar: o que já existe (toast + reset da base + modal de
  código se houver senha nova).

**Permissões e isolamento**

- Cadastro: só administrador (`RequireClinicAdmin`). Fisioterapeuta e
  secretário(a) já são mandados ao painel; o protótipo não inventa outro
  gate.
- Edição: administrador edita qualquer um da clínica; os outros só o
  próprio perfil (`RequireClinicUserSelfOrAdmin`). O protótipo só lê o
  hook existente. **Correção (2026-10-20, smoke da tarefa 002):** o GET e
  o PUT de usuário **não** filtram por `clinic_id` hoje
  (`ClinicUserController::show/update` + `Gate::before`); o admin de uma
  clínica lê usuário de outra. A correção é do backend, em
  `.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`.
- Frontend esconde; o backend continua a fonte de verdade. Nada nesta
  entrega altera Policy.

**Dados, fila, módulos**

- Sem migration, sem conversão de dado antigo, sem dado de saúde novo.
- Sem fila, WhatsApp, R2 ou Google de verdade (conectar/desconectar
  continuam stub no protótipo).
- Sem contrato novo entre módulos. Sem ADR novo: o 019 já cobre a troca
  de senha e permanece “em aberto” para a entrega real.

## Fatias Verticais

1. **Formulário compartilhado create | edit no Crachá ao vivo.** O hook e a
   variante A passam a ter modo. Cadastro: campos vazios, placeholders na
   prévia, senha obrigatória, sem código, sem Google, CTA “Criar usuário”,
   stub de criar. Edição: comportamento atual preservado (dados reais,
   “Nada alterado”, código na troca, lock do ADR 019, Google no próprio
   perfil). Demonstrável nas duas rotas, ainda que o cadastro seja
   alcançado só pelo componente até a fatia 2 ligar a página.
2. **Rota de cadastro no interruptor de protótipo.** `/clinica/usuarios/novo`
   em desenvolvimento abre a variante A; `?variant=O` mostra a v1. A lista
   (v1 ou protótipo) continua apontando para essa rota. Testes Vitest do
   hook (create vs edit) e da tela de cadastro no DS, mais conferência de
   que a edição não perdeu o código de senha nem o lock.

## Testes

- Como rodam: `npm run test` (Vitest). Sem PHPUnit nesta feature. O
  `bash bin/verificar.sh` cobre o diff desde a `main` (tipos, lint,
  testes do front).
- Padrões a copiar: testes de página em `resources/js/test/` com
  `@testing-library/react` e `userEvent`; textos em português;
  `browser-router` para rota; `vi.mock` de hooks de `application/` (como
  `ClinicAuthPages` e `PatientListPage`). Função pura com `describe` /
  `it` simples, no estilo de `permissions.test.ts`.
- O interruptor do protótipo desliga em `MODE=test`. Por isso os testes
  **não** passam pela página v1 esperando o Crachá: importam o protótipo
  (ou o hook) direto. A v1 de cadastro e edição permanece como está; não
  é obrigatório escrever teste novo dela.
- Comportamentos a cobrir:
  - Modo `create`: senha obrigatória; submit sem senha mostra erro; submit
    válido **não** abre modal de código e dispara o stub (toast), sem
    chamar hook de criar da API.
  - Modo `create`: prévia usa placeholder quando o nome está vazio;
    Google Agenda não aparece.
  - Modo `edit`: senha vazia não entra na lista de alterações; senha
    preenchida abre o passo de código; `passwordLockReason` continua
    batendo com a tabela do ADR 019 (própria senha liberada; outro
    admin só o mestre; mestre só ele mesmo; não-admin não troca a de
    outra pessoa).
  - Papel sem permissão: a rota de cadastro já redireciona (teste
    existente de `RequireClinicAdmin` / `permissions`; não duplicar a
    Policy). Isolamento de outra clínica não se testa aqui: não há
    endpoint novo. No smoke, conferir o GET de um id da clínica B pela A:
    hoje ele vaza (200), falha do backend da `main` já planejada em
    `.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`; aqui só se confere que o protótipo
    não inventa id nem dado.

## Fora do Escopo

- POST/PUT reais, upload de foto, e qualquer persistência. **Exceção
  (2026-10-20, pedido do usuário, tarefa 003):** o cadastro grava de
  verdade (POST e foto); a edição continua sem persistência.
- Endpoint, fila e tabela de código por e-mail (ADR 019). Mover
  `passwordLockReason` para `permissions.ts` e aplicar no backend.
- Promover o Crachá ao vivo a tela de produção (tirar o interruptor e a
  v1), como foi feito na lista de pacientes. **Exceção (tarefa 003):** o
  cadastro foi promovido; a edição não.
- Lista de usuários v2 (protótipo C à parte).
- Variantes B e C da edição (já descartadas).
- Verificação em duas etapas (coluna existe, fluxo não).
- Troca da senha do mestre por outro caminho (“esqueci minha senha”).
- Telas de usuário do painel admin (master).
- Convite por e-mail ou “definir senha no primeiro acesso”.

## Notas

- Branch desta worktree: `feat/user-editar-cadastro`. Não criar outra.
- Skills: `design-system`, `frontend-ddd` (a página continua sem
  `apiClient`; os schemas já estão em `application/`), `frontend-react`,
  `frontend-testing`. `prototype` vale como lembrete de que o código
  continua marcado como descartável; mesmo assim o harness pede teste e
  evidência desta fatia, porque o ciclo vai até a Definição de Pronto.
- Smoke no navegador: as duas rotas, computador e celular, tema claro e
  escuro. Incluir o caso “outra clínica”: o GET da edição vaza hoje
  (backend, ver “Permissões e isolamento”); o cadastro não lê outro
  usuário.
- Depois do plano: skill `criar-tarefas`.
