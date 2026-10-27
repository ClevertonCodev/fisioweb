# ADR: Modelos de evolução v2: como chegar à tela e o que o editor precisa garantir

## Contexto

Os protótipos dos modelos de evolução no design system v2 foram aprovados:

- Lista em `/clinica/templates/evolucoes`, variante A, "Cartões com prévia". Cada modelo é um cartão com as seções em miniatura. "Experimentar" abre uma gaveta onde se tocam os itens e aparece o texto que vai para o prontuário. Pasta: `pages/clinic/evolution-template/evolution-template-prototype/ListPrototype.tsx`.
- Editor em `/clinica/templates/evolucoes/novo` e `/:id/editar`, variante A, "Montar e ver ao vivo". As seções ficam em cartões, com um item por linha (nome no botão, texto do prontuário e se pede complemento), e ao lado o modelo funcionando. Pasta: `evolution-template-prototype/EditorPrototype.tsx` e `EditorA.tsx`.

Como está hoje:

- **Nenhum menu leva a essas telas.** Elas só existem nas rotas (`routes/clinic/evolution-template-routes.tsx`). Não há link no topo (`ClinicTopbar`), no menu da conta (`ClinicAccountMenu`), no início nem na gaveta de nova evolução. Quem não sabe a URL não acha a tela.
- O único modelo do banco de exemplo é o do sistema (id 1, "Template Geral de Fisioterapia", 7 seções e 40 itens). Os três modelos "Exemplo" da lista do protótipo estão fixos em `evolution-template-prototype/shared.ts` (`DEMO_TEMPLATES`, ids negativos, rotas `/exemplo1` a `/exemplo3`) só para a lista não ficar vazia.
- Regras do backend (`EvolutionTemplatePolicy`, `EvolutionTemplateController`, `EvolutionTemplateService`):
  - Qualquer usuário da clínica lista, vê, cria e edita.
  - Só administrador exclui (a Policy devolve `false` e o `Gate::before` libera administrador).
  - Modelo de outra clínica responde 404.
  - O modelo do sistema (`is_system`, `clinic_id` nulo) não se edita: o controller responde 404 e o service recusa.
- **Editar um modelo apaga o histórico de marcação das evoluções.** O `EvolutionTemplateRepository::replaceSections` apaga e recria todas as seções e itens a cada edição. Mas `clinic_patient_evolution_checked_items.evolution_template_item_id` tem `cascadeOnDelete`. Por isso, qualquer edição de um modelo apaga em cascata os itens marcados de todas as evoluções feitas com ele, inclusive as assinadas. O `generated_text` continua, mas a marcação se perde, e com ela o "Repetir a sessão" da nova evolução.
- **O interruptor "Ativo" da v1 não grava e ainda dispara o problema acima.** Para desativar, a lista v1 busca o modelo e manda tudo de volta no `PUT`, com as seções e com `is_active`. O `EvolutionTemplateService::update` ignora `is_active` (só grava nome, descrição e seções), mas recria as seções. Resultado: o modelo continua ativo, e a marcação das evoluções feitas com ele é apagada.

## Decisão

### Como chegar às telas

1. **Gaveta "Nova evolução"** (no prontuário): ao lado da escolha do modelo, um link "Gerenciar modelos" para `/clinica/templates/evolucoes`. É onde a pessoa sente falta de um modelo.
2. **Menu da conta** (`ClinicAccountMenu`), para todos os perfis: "Modelos de evolução", com a descrição "Itens prontos que viram texto no prontuário" e o caminho `/clinica/templates/evolucoes`. Se os questionários (`/clinica/questionarios`) ganharem entrada no mesmo menu, os dois ficam juntos num grupo "Modelos".
3. Cada link passa um `returnTo` quando vem do prontuário, como já fazem os questionários (`?returnTo=`). Ao salvar ou cancelar, a tela volta para lá.
4. O item fica destacado quando a rota atual começa com `/clinica/templates/evolucoes`, como o "Dados da clínica" faz hoje.

### Editor

1. **Antes de liberar o editor v2, o backend para de apagar e recriar itens** (detalhado no [ADR 021](021-editar-modelo-de-evolucao-nao-apaga-historico.md)). A edição passa a atualizar por id: item com `id` é atualizado, item novo é criado, e item removido é desativado (soft delete ou `is_active = false`), nunca apagado. A FK de `checked_items` deixa de ser `cascadeOnDelete` (passa a `restrictOnDelete`), para que um erro futuro não apague histórico em silêncio. O front manda o `id` de cada seção e de cada item que já existe.
2. **Modelo do sistema:** abre no editor com um aviso de que ele não muda. O botão principal vira "Salvar como cópia" e cria um modelo novo da clínica (`POST /evolution-templates`) com o que foi ajustado; o original continua igual. Na lista, o cartão do sistema tem "Duplicar" no lugar de "Editar" e não tem o interruptor "Ativo".
3. **"Experimentar"** usa o mesmo formato de texto do backend (`EvolutionService::generateText`): o título da seção em negrito, um item por linha e o complemento depois de " — ". Hoje isso está no componente `TryTemplate` (`evolution-template-prototype/parts.tsx`) e na função `lineOf` do `shared.ts`. Na tela real, as duas regras ficam iguais com teste, ou a prévia chama o endpoint de gerar texto.
4. **Validação** no Zod e no Form Request: nome obrigatório, ao menos uma seção, título em toda seção, ao menos um item por seção, e nome e texto do prontuário em todo item. O rodapé mostra o primeiro problema e quantos faltam. A tela real segue RHF + Zod (o protótipo usa `useState`).
5. **Ativar e desativar** usa uma rota própria (por exemplo `PATCH /evolution-templates/{id}/active`) que grava só `is_active`, sem mandar as seções. Modelo inativo some da escolha na nova evolução e continua na lista, com o selo "Inativo".
6. **Excluir** aparece só para administrador, desabilitado com o motivo para os outros ([ADR 017](017-acao-sem-permissao-visivel-e-desabilitada.md)). O aviso diz que as evoluções já escritas continuam no prontuário. Isso só vale depois do item 1, ou com exclusão lógica do modelo.
7. **Largura:** as duas telas usam a largura máxima do DS, `max-w-(--breakpoint-ds-xl)` (1920px), como a lista de pacientes.

## Consequências

- Benefícios:
  - A tela que estava escondida passa a ser achada por quem escreve evoluções.
  - Editar um modelo deixa de apagar dado clínico de evoluções antigas.
  - A prévia mostra exatamente o texto que vai para o prontuário.
- Custos:
  - Migração na FK de `checked_items` e uma coluna ou exclusão lógica nos itens e seções.
  - O update do service passa de "apaga e recria" para sincronizar por id, com testes.
- Regras que agentes devem preservar:
  - Não liberar o editor v2 (nem manter o v1 editando) com `replaceSections` apagando itens que já têm `checked_items`.
  - Teste de feature: editar um modelo usado numa evolução assinada mantém os `checked_items` dela. Outro teste: modelo de outra clínica e modelo do sistema respondem 404 no update. Outro: desativar grava `is_active` e não mexe nas seções.
  - Até a correção, ninguém deve usar o interruptor "Ativo" da v1 em modelo que já tem evolução.
  - Apagar `DEMO_TEMPLATES` e as rotas `/exemploN` junto com a pasta do protótipo.

## Alternativas descartadas

- Manter o "apaga e recria" e só tirar o `cascadeOnDelete`: a edição passaria a falhar (FK) assim que o modelo tivesse uma evolução.
- Guardar uma cópia do modelo dentro de cada evolução: resolve o histórico, mas duplica dado; o `generated_text` já guarda o que foi escrito.
- Link só no menu do topo: o topo tem as áreas do dia a dia (agenda, pacientes, programas); modelo é configuração de vez em quando.

## Em aberto

- Se secretário(a) deve criar e editar modelos (hoje pode). A tela segue a Policy; mudar a Policy é decisão de produto.
