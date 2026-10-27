# Lista v2 em cartões e sanfona substitui a v1

**Tipo:** História
**Plano:** `../plans/clinic-usuarios-ds.md`
**Issue:** ainda não criada

## Descrição

A `/clinica/usuarios` ainda mostra a tabela v1 em produção. O protótipo C (Funções e acessos), aprovado, só aparece em desenvolvimento, tem mutações stub e não tem testes. Esta tarefa troca a v1 pela lista em cartões no DS v2, em todos os ambientes, com busca e filtros na URL e o drawer de leitura. Mudar função, desativar e excluir entram nas tarefas 003 e 004.

A página é reescrita com testes, usando o protótipo como referência visual. Os toasts de stub não entram.

## O que construir

- **Página:** `/clinica/usuarios`, só do administrador (`RequireClinicAdmin` já envolve a rota). DS v2 (só `Ds*` e tokens `--ds-*`), dentro do `ClinicLayout`, com rolagem própria e largura máxima de 1920px. Respeita o tema escuro. Fisioterapeuta e secretária continuam redirecionados para o início da clínica.
- **Cabeçalho:** título "Usuários"; o resumo "N pessoas na equipe · N ativas" (sem 2FA: decisão de 2026-10-20 pelo ADR 019, ver `DEFERRED.md`); botão "Novo usuário" (largura cheia no celular) para `/clinica/usuarios/novo`.
- **Barra:** busca por nome ou e-mail, com debounce de 400ms; filtros Função (multi) e Status (Ativo / Inativo). No celular, os filtros abrem numa gaveta de baixo, com a contagem do recorte. Chips dos filtros aplicados; "Nenhum filtro aplicado" quando não há chip; "Limpar" zera função e status e deixa a busca.
- **URL:** `q`, `funcao` (papéis válidos, separados por vírgula) e `status` (`ativos` ou `inativos`). Ausente = todos. Valor inválido cai no padrão e não vira chip. Valor igual ao padrão não vai para a URL. Escrita com `replace`. Sem paginação.
- **Cartões:** foto ou inicial, nome, e-mail, selo de função, selo de status, sinal compacto de Google Agenda (sem 2FA: decisão de 2026-10-20 pelo ADR 019, ver `DEFERRED.md`). Inativo esmaecido. Mestre reconhecível pela coroa (ainda sem arrastar). Grade de dois cartões em tela larga. Clicar no cartão abre o drawer.
- **Funções do sistema:** coluna à direita (fixa no desktop) com as três funções em sanfona, descrição, contagem no recorte filtrado e a lista do que cada uma pode (agenda, prontuário, assinar, inativar paciente, excluir, gerenciar equipe, dados da clínica). Capacidades estáticas no frontend, alinhadas às permissões já existentes — não vêm da API.
- **Drawer (leitura):** foto, selos (função, status, Mestre), e-mail, documento, números de pacientes / programas / agenda da semana agregados no front (pacientes pelo nome do profissional, primeira página de 200, consultas da semana), sinal de Google Agenda (sem 2FA: decisão de 2026-10-20 pelo ADR 019, ver `DEFERRED.md`), capacidades da função atual. Atalho Editar abre a tela v1 `/clinica/usuarios/:id/editar`. Rodapé já deixa espaço para Desativar/Excluir, que a 004 liga; nesta fatia esses botões não disparam API.
- **Estados:** esqueleto de cartões; erro ao carregar; ninguém no recorte, com botão para limpar filtros; clínica só com o admin e sem busca, um convite para cadastrar a equipe.
- **Remoção:** saem a tabela v1, a pasta do protótipo da lista e o `PrototypeSwitcher` dessa rota. O `PrototypeSwitcher` continua no código (edição e outras telas usam). Novo e Editar continuam v1.
- **Backend:** não muda nesta tarefa (a 001 já entregou os campos e o update parcial). Isolamento da listagem já existe.

## Critérios de Aceite

- [x] Em produção (`fisio-app build`) e em dev, `/clinica/usuarios` mostra os cartões e a sanfona. A tabela v1 e o seletor `?variant=` não aparecem mais nessa rota.
- [x] O cartão mostra foto ou inicial, nome, e-mail, função, status e o sinal de Google Agenda; nada de 2FA (ADR 019). Inativo esmaecido com o selo "Inativo" (teste).
- [x] O resumo do cabeçalho conta pessoas e ativas, sem o trecho de 2FA (ADR 019) (teste).
- [x] As funções puras de URL leem e escrevem `q`, `funcao` e `status`; valores inválidos caem no padrão; valores padrão não aparecem na URL (testes unitários).
- [x] Abrir `/clinica/usuarios?q=ana&funcao=physiotherapist&status=ativos` mostra esse recorte nos filtros e nos chips (teste da página).
- [x] Remover um chip limpa só aquele filtro; "Limpar" zera função e status (teste).
- [x] Clicar no cartão abre o drawer com nome, e-mail e Editar; Editar navega para `/clinica/usuarios/{id}/editar` (teste).
- [x] Abrir a edição e voltar pelo navegador mantém busca e filtros (smoke test).
- [x] Fisioterapeuta ou secretária em `/clinica/usuarios` é redirecionado para `/clinica` (smoke test; o `RequireClinicAdmin` já faz isso).
- [x] Estados de carregamento, erro, nenhum resultado e convite para o primeiro colega aparecem nos casos certos (teste).
- [x] A tela funciona a 375px sem rolagem horizontal, e no tema escuro (smoke test com captura).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-listagem-e-put-parcial` (timestamps na listagem e mapper).

## Notas de Implementação

- **Branch:** `feat/user-listagem-ds`
- **Exemplo no código:** protótipo C (`UserListPrototype`, `VariantC`, `parts`) como referência visual; lista de pacientes (`patient-list-filters`, `use-patient-list-url-state`, chips) para o padrão de URL; `ExercisesPage.test.tsx` para o teste da página.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`.
- Divida a página em partes pequenas (cartão, sanfona, drawer, barra, chips) numa pasta própria da lista. A página não importa `apiClient`.
- O estado da URL usa `useSearchParams`. Funções de ler e escrever ficam puras, fora do componente.
- Não ligue o `@dnd-kit` nesta tarefa. O cartão do mestre já pode mostrar a coroa; o puxador de arraste entra na 003.
- Agregação de carga: se pacientes/programas/agenda ainda carregam, mostre 0 ou o esqueleto só no drawer — a lista não espera essas queries (como o protótipo).
- O botão de 2FA "Pedir para ativar" do protótipo **não** entra (sem endpoint; vai para o `DEFERRED.md` da feature quando a decisão for tomada).

## Como testar na mão

1. `fisio-app build` e `fisio-app url`. Entrar na Clínica Cleverton como admin.
2. Abrir `/clinica/usuarios`: cartões à esquerda, funções à direita, resumo no cabeçalho. Sem `?variant=`.
3. Buscar por parte do nome: a URL ganha `q=`. Filtrar Fisioterapeuta e Ativo: chips e `funcao`/`status` na URL.
4. Clicar num cartão: drawer com KPIs e Editar. Editar, voltar: busca e filtros continuam.
5. Editar a URL para `funcao=foo&status=xyz`: a tela cai no padrão, sem chip estranho.
6. Reduzir a janela para 375px (gaveta de filtros) e ligar o tema escuro.
7. Entrar como fisioterapeuta: `/clinica/usuarios` redireciona para `/clinica`.
8. Entrar na Clínica Start: a equipe da Cleverton não aparece.
