# Painel B vira a tela de verdade (leitura)

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-ds.md`
**Issue:** ainda não criada

## Descrição

Em produção o prontuário ainda é a v1. Em desenvolvimento o painel B só aparece com o interruptor de protótipo, e ainda filtra consultas e programas no navegador. Quem abre o paciente não vê o acompanhamento aprovado, e a suíte de testes continua na v1.

Esta fatia troca a rota `/clinica/pacientes/:id` pelo painel B em todos os ambientes, só leitura: cabeçalho, números, gráfico, próximos passos, abas, busca e drawer. As ações que gravam, o WhatsApp, o Agendar e o link do questionário entram na tarefa 004. Os botões de ação rápida podem aparecer, mas ainda não abrem fluxo que grava (exceto “Editar cadastro”, “Nova avaliação” e “Abrir programa”, que já são rotas reais).

## O que construir

- **Tela:** `/clinica/pacientes/:id` no DS v2 (só `Ds*` e tokens `--ds-*`), dentro do `ClinicLayout`, largura máxima 1920px. Tema claro e escuro.
- **Substituição:** a B entra em produção, dev e teste. Saem a v1 desta rota, o `?variant=` e a barra do protótipo. ADR no espírito do 016 (próximo número livre).
- **Pasta:** as peças saem do protótipo para uma pasta de tela de verdade. O hook “abaixo de sm” vai para os hooks comuns (não o `useIsMobile` de 768px). As pastas `new-evolution`, `new-file` e `new-questionnaire` **ficam** onde estão.
- **Dados:** junta paciente, evoluções, avaliações, questionários, arquivos, consultas e programas pelos hooks da tarefa 001. Nada filtrado por paciente no navegador. Página não importa `apiClient`.
- **Cabeçalho:** foto, nome, situação, idade, convênio, telefone (ligar), voltar, editar cadastro, cartão da próxima consulta. WhatsApp do cabeçalho fica para a 004 (pode renderizar desligado ou ausente).
- **Painel:** alerta de faltas seguidas, os quatro números (função da tarefa 001), aviso ao fisioterapeuta de que os números são das consultas dele, gráfico dos últimos 12 meses (clique no ponto abre o drawer da consulta), próximos passos.
- **Registros:** abas Clínico, Consultas, Programas e Arquivos, com a aba na URL (`tab=clinico|agenda|programas|arquivos`). Valor inválido ou `?tab=` antigo da v1 cai em Clínico.
- **Busca:** acima das abas, só evolução, avaliação, questionário e arquivo. Consultas e programas não entram.
- **Drawer de leitura:** evolução (texto, condutas, modelo), avaliação (atalho para a tela real), questionário (respostas reais, sem formulário de responder), arquivo (prévia e baixar), consulta (ver na agenda), programa (abrir). Editar rascunho, excluir e compartilhar link ficam para a 004.
- **Estados:** esqueleto; 404 se o paciente não existe ou é de outra clínica; erro de uma lista sem derrubar o resto; vazio com os próximos passos.
- **Papel:** qualquer papel da clínica lê. Fisioterapeuta vê todos os registros clínicos do paciente (evolução, avaliação, questionário, arquivo, programa), mesmo que outro profissional tenha feito; as consultas do painel continuam só as dele.

## Critérios de Aceite

- [ ] Em produção, dev e teste, `/clinica/pacientes/:id` mostra o painel B. A v1 e o `?variant=` desta rota não existem mais (teste da página).
- [ ] O cabeçalho mostra foto, nome, situação, idade, convênio, telefone e “Editar cadastro”. Voltar vai para a lista (teste).
- [ ] Os quatro números e o gráfico usam a função pura e as listas já filtradas pela API; o teste da página não mocka um filtro local por `patientId` (teste).
- [ ] Fisioterapeuta vê o aviso de que os números são das consultas dele (teste).
- [ ] `?tab=arquivos` abre a aba Arquivos; F5 mantém; `?tab=questionnaires` (v1) cai em Clínico (teste).
- [ ] A busca filtra os quatro tipos da v1 e não esconde consulta nem programa (teste).
- [ ] Clicar num registro (e num ponto do gráfico) abre o drawer com os dados reais; questionário respondido mostra as respostas; arquivo tem Baixar (teste).
- [ ] Paciente inexistente ou de outra clínica: 404 com volta à lista, sem vazar que o id existe (teste).
- [ ] Erro de uma lista (ex.: evoluções) não esconde cabeçalho nem as outras abas (teste).
- [ ] Paciente sem registro mostra os próximos passos (teste).
- [ ] A tela usa a largura até 1920px e funciona no tema escuro (smoke).
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-consultas-e-programas-por-paciente` (filtro na API e função dos números).

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-ds`
- **Exemplo no código:** protótipo B (`VariantB`, `data`, `parts`) como referência visual; `PatientListPage.test.tsx` para página + `useAuth` + papel; lista de pacientes v2 para a troca v1 → v2 (ADR 016).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`, `frontend-ui-patterns` (só para não misturar v1 no painel).
- Respostas do questionário: o hook de detalhe que a v1 já usa. Sem `QuestionnaireViewSheet` em modo responder.
- “Nova avaliação” e “Editar cadastro” e “Abrir programa” já são navegação: podem funcionar nesta fatia. “Prescrever” / “Novo programa” sem `patientId` ainda — a 004 acrescenta o query param.
- Não apagar `new-evolution/`, `new-file/`, `new-questionnaire/`.

## Como testar na mão

1. `fisio-app build` (ou o equivalente do ambiente). Abra `/clinica/pacientes/:id` de um paciente da clínica A, sem `?variant=`.
2. Confira cabeçalho, números, gráfico, próximos passos e as quatro abas.
3. Troque para Arquivos, dê F5: continua em Arquivos. A URL tem `tab=arquivos`.
4. Busque o título de uma evolução: some da aba Clínico o que não bate; a aba Consultas não esvazia por causa da busca.
5. Abra uma evolução, um questionário respondido e um arquivo no drawer. Baixe o arquivo.
6. Entre como fisioterapeuta: o aviso dos números aparece; uma evolução feita por outro profissional deste paciente continua na lista.
7. Entre como clínica B no mesmo id: 404.
8. Tema escuro e largura de celular (375px): sem barra horizontal no painel.
