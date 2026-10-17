# Lista de pacientes v2 em cartões substitui a v1

**Tipo:** História
**Plano:** `../plans/clinic-pacientes-ds.md`
**Issue:** ainda não criada

## Descrição

A `/clinica/pacientes` ainda mostra a tabela v1 em produção. O protótipo C2 (commit c93122b), aprovado, só aparece em desenvolvimento e não tem testes. Esta tarefa troca a v1 pela lista em cartões no DS v2, em todos os ambientes. A página é reescrita com testes, usando o protótipo como referência visual.

Esta fatia entrega a leitura com busca, paginação e itens por página na URL. Os filtros da barra (cadastro, situação, status, profissional) e os chips entram na tarefa 003. Inativar e reativar entram nas tarefas 004 e 005.

## O que construir

- **Página:** a página da clínica em `/clinica/pacientes`, no DS v2 (só `Ds*` e tokens `--ds-*`), dentro do `ClinicLayout`, com rolagem própria e largura máxima de 1920px. Respeita o tema escuro.
- **Cabeçalho:** título "Pacientes"; o total ("N pacientes cadastrados", ou "N pacientes encontrados" com busca); o botão "Novo paciente", que no celular mostra só o "+".
- **Barra:** a busca por nome, e-mail ou CPF, com debounce de 400ms, e o seletor de itens por página (15, 30 ou 50). A linha de chips fica com altura fixa e mostra "Nenhum filtro aplicado"; nesta tarefa, só o chip de itens por página diferente do padrão aparece. No celular, os itens por página ficam fora da barra, como no protótipo.
- **Cartão:**
  - foto ou inicial, nome, "por {profissional}", selo de status, diagnóstico em até 3 linhas ("Sem diagnóstico registrado." quando vazio);
  - clicar no cartão abre o prontuário;
  - o rodapé tem os atalhos Programas, Agendamentos e Editar perfil, só com ícone e tooltip, e os mesmos destinos da v1. Clicar num atalho não abre o prontuário;
  - o cartão do paciente inativo fica esmaecido e mostra o selo "Inativo" ao lado do status. Os atalhos continuam funcionando.
- **Estados:**
  - carregando: esqueleto de cartões;
  - erro: estado de erro;
  - nenhum resultado com busca: "Nenhum paciente encontrado";
  - clínica sem nenhum paciente e sem busca: um convite para cadastrar, com o botão "Novo paciente".
- **Paginação:** `DsPagination`.
- **URL:** busca (`q`), página (`page`) e itens por página (`per_page`) ficam na query string, pelas funções puras de filtros na URL da `application/clinic`. Esta tarefa cria as funções com esses três campos, e a 003 acrescenta os outros.
  - Um valor inválido cai no padrão: `page` 1 e `per_page` 15.
  - Um valor igual ao padrão não vai para a URL.
  - Mudar a busca ou o `per_page` volta para a página 1.
  - A URL é atualizada com `replace`.
- **Domain:** o `Patient` ganha `isActive`, mapeado do `is_active` da listagem. Se o campo faltar, conta como ativo.
- **Remoção:** saem a `PatientListOriginal`, a pasta `patient-list-prototype/` e o uso do `PrototypeSwitcher` nessa rota. O `PrototypeSwitcher` continua no código porque a agenda usa.
- **Backend:** não muda. A listagem já filtra por `clinic_id` e todos os papéis veem a lista.

## Critérios de Aceite

- [x] Em produção (`fisio-app build`) e em dev, `/clinica/pacientes` mostra a lista em cartões. A tabela v1 e o seletor `?variant=` não aparecem mais.
- [x] O cartão mostra foto ou inicial, nome, profissional, status e diagnóstico em até 3 linhas. Clicar abre `/clinica/pacientes/{id}`.
- [x] Os atalhos levam aos mesmos destinos da v1 (programas com `patientId` e `search`, agenda com `patientId`, edição) e não abrem o prontuário (teste).
- [x] Paciente com `isActive = false` mostra o selo "Inativo" e o cartão esmaecido (teste).
- [x] O mapper converte `is_active` em `isActive`, e a ausência do campo vira `true` (teste em `api-clinic-patients.test.ts`).
- [x] As funções de URL leem e escrevem `q`, `page` e `per_page`; `per_page=200`, `per_page=abc`, `page=0` e `page=-1` caem no padrão; valores padrão não aparecem na URL (testes unitários).
- [x] Abrir `/clinica/pacientes?q=maria&page=2&per_page=30` carrega a lista com essa busca, página e quantidade (teste da página).
- [x] Mudar a busca ou o `per_page` volta para a página 1 (teste).
- [x] Abrir o prontuário e voltar pelo navegador mantém a busca, a página e o `per_page` (smoke test).
- [x] O total diz "cadastrados" sem busca e "encontrados" com busca, no singular e no plural (teste).
- [x] Os estados de carregamento, erro, nenhum resultado e clínica sem pacientes aparecem nos casos certos (teste).
- [x] A tela funciona a 375px de largura sem rolagem horizontal, e no tema escuro (smoke test com captura).
- [x] Um usuário de outra clínica não vê nenhum paciente desta clínica na lista, nem pela busca por CPF (smoke test; o backend já é coberto pelo `PatientClinicIsolationTest`).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. Pode correr em paralelo com a `001-is-active-so-pelos-endpoints`.

## Notas de Implementação

- **Branch:** `feat/clinic-pacientes-ds`.
- **Exemplo no código:** o protótipo do commit c93122b (`VariantC`, `shared`, `CardActions`) como referência visual e de estados; `ExercisesPage.test.tsx` para o padrão de teste da página (`vi.mock` do router, do `useAuth` e dos repositórios).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`.
- Divida a página em partes pequenas (cartão, ações do cartão, barra, estados) numa pasta própria da lista de pacientes. A página não importa `apiClient`.
- O estado da URL usa `useSearchParams`. As funções de ler e escrever ficam puras, fora do componente, para poderem ser testadas sem renderizar.
- Deixe o rodapé do cartão pronto para receber um quarto atalho (a 004 acrescenta inativar).
- A tarefa 013 da feature 002 (fisioterapeuta vê só os pacientes dele) vai restringir essa mesma listagem no backend. Se ela entrar antes, nada muda nesta tela.

## Como testar na mão

1. `fisio-app build` e `fisio-app url`; entrar na Clínica Cleverton como admin (credenciais do admin da clínica no `DatabaseSeeder`). Cadastrar alguns pacientes se a lista estiver vazia, e inativar um pela v1 antes de trocar ou direto no `fisio-app psql`.
2. Abrir `/clinica/pacientes`: os cartões aparecem, o inativo esmaecido com o selo "Inativo".
3. Buscar por parte do nome e pelo CPF com máscara: a URL ganha `q=` e o total diz "encontrados".
4. Trocar para 30 por página: aparece o chip "Itens por página 30" e a URL ganha `per_page=30`. Ir para a página 2.
5. Clicar num cartão e voltar: a busca, a página e o `per_page` continuam iguais.
6. Editar a URL para `per_page=200`: a tela usa 15.
7. Testar os atalhos Programas, Agendamentos e Editar.
8. Reduzir a janela para 375px e ligar o tema escuro.
9. Entrar na Clínica Start (`start@fisioweb.local`) e buscar o CPF de um paciente da Cleverton: nada aparece.
