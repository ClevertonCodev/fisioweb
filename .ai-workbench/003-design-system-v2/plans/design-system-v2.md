# Design system da versão 2 (port do DS Vue para React)

Data: 2026-10-15
Fonte: conversa com o usuário, refinada com a skill `refinar` em 2026-10-15. A origem é o design system Vue + SCSS copiado para `resources/design-system/` (fora do git), que tem 35 componentes `Ds*`, tokens SCSS/CSS e 18 testes.

## Problema

As telas da versão 2 do fisioweb vão seguir um design system que hoje só existe em Vue + SCSS. O SPA é React 19 + Tailwind v4 + shadcn, então nenhum desses componentes pode ser usado. Quem for montar uma tela v2 teria de reinventar cada botão, campo e modal à mão, com risco de divergir do desenho.

Hoje a pasta Vue dentro do repositório também quebra o `npm run test`, porque o Vitest tenta rodar os testes Vue sem `@vue/test-utils` e sem o alias `@/design-system-v2`.

## Solução

Uma biblioteca React com os 35 componentes do DS, portados 1:1 em visual e API e prontos para as telas v2:

- Os tokens do DS (cores, Poppins/Geist Mono, escala tipográfica, espaçamentos, raios, sombras, breakpoints) passam a existir como variáveis CSS `--ds-*`, nos modos light e dark.
- Cada componente `Ds*` tem um equivalente React com as mesmas props e o mesmo visual, construído com Tailwind, cva e Radix.
- O `DsThemeToggle` alterna light e dark nas telas v2.
- Uma página de catálogo em `/design-system`, disponível só no ambiente de desenvolvimento, mostra cada componente em todas as variantes e estados, nos dois temas.
- Nada que existe hoje muda de visual ou de comportamento: telas, layouts, `components/ui` e o tema shadcn ficam como estão. A migração das telas v1 é outra feature.
- No fim, a pasta Vue é apagada.

## Histórias de Usuário

1. Como dev que vai montar uma tela v2, quero importar qualquer componente do DS de um único ponto, para não procurar onde cada um está.
2. Como dev, quero que os componentes React tenham as mesmas props do DS Vue (com `value`/`onChange` no lugar de `v-model` e `onX` no lugar dos emits), para que a documentação e o desenho do DS valham para os dois.
3. Como dev, quero que os campos do DS aceitem `ref`, `name`, `onBlur` e o restante das props nativas, para usá-los com React Hook Form (`register` ou `FormField`) sem adaptador.
4. Como dev, quero tokens do DS com nomes próprios (`bg-ds-primary-100`, `text-ds-body-xs`, `font-ds`), para estilizar uma tela v2 sem misturar com o tema shadcn da v1.
5. Como dev, quero que os tokens do DS nunca sobrescrevam os tokens shadcn (`--primary`, `--background`...), para que as telas v1 continuem iguais.
6. Como dev, quero que a fonte Poppins (e a Geist Mono para mono e eyebrow) seja aplicada só pelos componentes e telas do DS, para que a v1 continue em Inter.
7. Como dev, quero uma página `/design-system` em dev com todos os componentes, variantes e estados, para conferir o visual sem precisar de uma tela v2.
8. Como dev, quero alternar light e dark no catálogo, para conferir os dois temas de cada componente.
9. Como dev, quero ter certeza de que `/design-system` não existe no build de produção, para não expor uma página interna.
10. Como usuário das telas v2, quero alternar entre tema claro e escuro, e que a escolha seja lembrada na próxima visita.
11. Como usuário das telas v1, quero que nada mude no meu sistema enquanto a v2 é construída.
12. Como usuário das telas v2, quero botões nas variantes, tamanhos e estados do DS (primary, secondary, tertiary, ghost/danger conforme o Vue; loading; disabled; só ícone com tooltip), para reconhecer a ação de cada um.
13. Como usuário, quero que um botão só de ícone sempre mostre um tooltip com o nome da ação, no hover e no foco do teclado.
14. Como usuário, quero campos de texto com rótulo, texto de ajuda e estados de sucesso e erro, para entender o que preencher e o que está errado.
15. Como usuário, quero digitar CPF, CNPJ (inclusive o alfanumérico), RG, CNH e passaporte com a máscara aplicada enquanto digito, para não errar o formato.
16. Como usuário, quero digitar o telefone com seletor de país e bandeira, com validação do número, para cadastrar pacientes de qualquer país.
17. Como usuário, quero digitar valores em reais com a máscara de moeda.
18. Como usuário, quero checkbox, radio e switch com o visual do DS, operáveis por teclado.
19. Como usuário, quero um select simples e um select de campo com busca e opções (inclusive múltiplas, se o Vue suportar), operáveis por teclado.
20. Como usuário, quero badges de status (pendente, em andamento, enviado, em revisão, sucesso, falhou, expirado, aguardando) com as cores do DS, para ler o estado de algo de relance.
21. Como usuário, quero alertas e banners de informação, sucesso, aviso e erro, para entender o que aconteceu.
22. Como usuário, quero cards, KPIs, listas e estados vazios com o visual do DS, para ler os painéis da v2.
23. Como usuário, quero abas, passos (steps) e seções recolhíveis, navegáveis por teclado.
24. Como usuário, quero que modal e drawer prendam o foco, fechem com Esc e devolvam o foco para quem os abriu.
25. Como usuário, quero menus dropdown navegáveis por setas, Enter e Esc.
26. Como usuário, quero tooltips que aparecem no hover e no foco do teclado.
27. Como usuário, quero paginação com o visual do DS.
28. Como usuário, quero escolher uma data ou um intervalo de datas, com atalhos (presets) quando o DS os oferece, em português.
29. Como usuário, quero escolher um horário pelo seletor de horário do DS.
30. Como usuário, quero tabelas com ordenação, seleção de linhas, ações por linha, ações em lote, carregamento e mensagem de vazio.
31. Como dev que vai migrar uma tela, quero que cada componente tenha teste, para mudar o DS sem quebrar tela v2 sem perceber.
32. Como dev, quero que `npm run test`, `npm run lint`, `npm run types` e `npm run build` passem sem a pasta Vue interferir.
33. Como dev que vai construir as telas v2, quero uma skill que explique o DS (tokens, componentes, quando usar cada um), para o agente usar o DS em vez do shadcn nas telas v2.
34. Como mantenedor do repositório, quero que nenhum código Vue nem dependência Vue (`vue`, `maska`, `@vue/test-utils`) entre no git.

## Decisões de Implementação

**Onde vive**

- Só frontend. Não há backend, migration, rota de API, Policy, fila nem dado de saúde. Nada fala com a API, então não há `domain/`, `application/` nem `infrastructure/`.
- Os componentes ficam em `resources/js/components/ds/`, uma pasta por componente, como no Vue, com o tipo das props ao lado. O barrel é importado como `@/components/ds`.
- O catálogo é uma página fora de `pages/admin` e `pages/clinic`, com rota própria registrada no `App.tsx` só quando `import.meta.env.DEV`. Ela fica sem login e sem `AdminLayout`/`ClinicLayout`, e a rota não entra no bundle de produção (import dinâmico atrás da condição).

**Identidade e tokens**

- Os valores de cor, fonte, escala, espaçamento, raio, sombra e breakpoint são copiados 1:1 do `tokens.css` e do SCSS do Vue. O nome "Paytour" sai e o prefixo `--ds-v2-*` vira `--ds-*`.
- Os tokens ficam num arquivo CSS próprio do DS, importado pelo `app.css`. É a única linha alterada nele, além do `@import` das fontes Poppins e Geist Mono pelo Google Fonts.
- Os tokens viram utilitários Tailwind por um `@theme inline` próprio, com namespace `ds` (`--color-ds-*`, `--font-ds`, `--font-ds-mono`, `--text-ds-*`, `--radius-ds-*`, `--shadow-ds-*`), apontando para as variáveis `--ds-*`. Assim, a troca de tema só troca as variáveis.
- O dark mode usa o seletor `[data-theme="dark"]` no `<html>`, como no Vue, e não `.dark`. O `.dark` já existe no `app.css` e mudaria o tema shadcn da v1. Os componentes não usam a variante `dark:` do Tailwind (que no v4 segue `prefers-color-scheme`); eles consomem tokens semânticos que mudam de valor sob `[data-theme="dark"]`. As correções de contraste do dark que estão em blocos globais do Vue (botão, por exemplo) entram como tokens ou como regras sob o mesmo seletor.
- Cada componente aplica `font-ds` na própria raiz, porque o `body` continua em Inter. Também define a própria cor de borda, para não herdar o `border-border` da base shadcn.

**Componentes**

- O estilo usa Tailwind com tokens `ds`, as variantes usam cva e as classes são juntadas com o `cn` que o SPA já usa. Não entra `sass`.
- Por baixo, ficam os primitivos Radix que já estão instalados: Modal e Drawer (Dialog), Tooltip, Dropdown (DropdownMenu), Tabs, Checkbox, Radio (RadioGroup), Switch, Collapse (Collapsible) e Select. O select com busca usa Popover + cmdk. O Datepicker usa react-day-picker + date-fns com locale pt-BR. Button, Input, Textarea, Badge, Alert, Banner, Card, Kpi, List, EmptyState, Steps, Pagination, Timepicker e Table são feitos do zero.
- Os ícones usam lucide em tudo, inclusive nos internos (caret, x, relógio...), cada um trocado pelo equivalente mais próximo. As props `icon` (Tabs, Dropdown, Table actions, EmptyState...) deixam de receber a string `ph-*` e passam a receber um elemento React (`icon={<House />}`).
- A API segue a do Vue: mesmos nomes de props, mesmos valores de variante e mesmos defaults. `modelValue` + `update:modelValue` vira `value` + `onChange`. Cada emit vira um callback `onX` com o mesmo dado. Slots viram `children` ou props `ReactNode` com o mesmo nome do slot.
- As máscaras não usam biblioteca. As regras de `utils/brazilian-document.ts` e `utils/phone.ts` (hoje com `maska`) viram funções puras de formatação e validação, no mesmo estilo de `cpf-cnpj-input.tsx` e `phone-input.tsx`, com os mesmos formatos (CPF, CNPJ alfanumérico, RG com letras e separadores, CNH, passaporte e telefone por país). A lista de países e a bandeira (`constants/countries.ts`, `utils/country-flag.ts`) são portadas junto.
- O `DsTimepicker` é portado, mesmo não estando no `index.ts` do Vue.
- O `DsThemeToggle` é novo: um botão do DS que alterna o `data-theme` do `<html>` e grava a escolha no `localStorage` (leitura e escrita com try/catch). Um hook do DS aplica o tema salvo quando uma tela v2 monta. O toggle não é colocado em nenhum layout existente.

**Ferramentas**

- A primeira fatia exclui `resources/design-system/` do Vitest, do ESLint e do git (`.gitignore`). Isso conserta o `npm run test`, que hoje quebra. A pasta continua no disco como referência até a última fatia, que a apaga. `vue`, `maska` e `@vue/test-utils` nunca entram no `package.json`.
- Arquivos existentes que mudam, todos só com acréscimo: `app.css` (import dos tokens e fontes), `App.tsx` (rota de dev), `vitest.config.ts`, `eslint.config.js`, `.gitignore` e, na última fatia, a tabela de skills do `CLAUDE.md`. Nenhum arquivo de `components/ui`, `pages`, `routes/admin*` ou `routes/clinic*` muda.

**Documentação**

- A última fatia cria uma skill `design-system` em `.claude/skills/` com tokens, catálogo de componentes, a regra "tela v2 usa DS, tela v1 usa shadcn" e como usar com RHF. A skill entra no Skill Map do `CLAUDE.md`. Não precisa de ADR, porque não há fronteira de módulo backend.

## Fatias Verticais

Uma branch só, `feat/design-system-v2`, com uma PR no fim, por decisão do usuário. Cada fatia é um conjunto de commits que pode ser demonstrado sozinho no catálogo.

1. **Fundação, tema e botão.** Excluir a pasta Vue do Vitest, do ESLint e do git. Criar os tokens `--ds-*` light e dark, as fontes e o `@theme` `ds`. Criar a rota de dev `/design-system` com o esqueleto do catálogo, o `DsThemeToggle` com seu hook, o `DsTooltip` e o `DsButton` (que usa o tooltip quando é só ícone). Demonstração: o catálogo mostra todas as variantes do botão, em light e dark.
2. **Campos de texto.** `DsInput`, `DsTextarea` e `DsMoneyInput`, mais os utilitários de máscara em funções puras. Demonstração: no catálogo, cada campo em todos os estados, com digitação mascarada.
3. **Documentos e telefone.** `DsCpfField`, `DsCnpjField`, `DsRgField`, `DsCnhField`, `DsPassportField`, `DsCountrySelect` e `DsPhoneField`, com a lista de países, a bandeira e a validação de telefone. Demonstração: digitar cada documento e um telefone de outro país no catálogo.
4. **Escolhas.** `DsCheckbox`, `DsRadio`, `DsSwitch`, `DsSelect`, `DsFieldSelect` e `DsFieldSelectOptions`. Demonstração: no catálogo, cada um operado só pelo teclado, mais um formulário de exemplo com RHF + Zod juntando campos das fatias 2 a 4.
5. **Feedback e estrutura.** `DsBadge`, `DsAlert`, `DsBanner`, `DsCard`, `DsKpi`, `DsList`, `DsEmptyState`, `DsCollapse`, `DsTabs` e `DsSteps`. Demonstração: seções do catálogo com cada variante.
6. **Overlays e navegação.** `DsModal`, `DsDrawer`, `DsDropdown` e `DsPagination`. Demonstração: abrir e fechar cada overlay por teclado no catálogo, com o foco preso e depois devolvido.
7. **Data e hora.** `DsDatepicker` (data única, intervalo e presets, em pt-BR) e `DsTimepicker`. Demonstração: escolher data, intervalo e horário no catálogo.
8. **Tabela.** `DsTable` com ordenação, seleção, ações por linha (com `DsTooltip`), ações em lote, carregamento e vazio. Como no Vue, a tabela só avisa a ação em lote (`onBulkAction`) e não abre confirmação. O `confirmationLabel` fica no tipo, sem comportamento, igual ao Vue. Demonstração: uma tabela de exemplo no catálogo, com dados fictícios.
9. **Limpeza e documentação.** Apagar `resources/design-system/` e a entrada no `.gitignore`, criar a skill `design-system` e incluí-la no `CLAUDE.md`. Conferir no build de produção que `/design-system` não existe e que o diff contra a `main` não toca nenhum arquivo da v1 além dos acréscimos listados.

## Testes

- Os testes rodam com `npm run test` (Vitest 4 + Testing Library 16 + user-event 14, jsdom, setup em `resources/js/test/setup.ts`). Para um arquivo só: `npx vitest run resources/js/test/ds/<arquivo>`.
- Os testes do DS ficam em `resources/js/test/ds/`, seguindo a pasta de testes do SPA. Os padrões existentes copiados são `ProgramWizardNavBar.test.tsx` e `AppointmentModal.test.tsx` (render + `userEvent` + `screen`), sem mock de API.
- Comportamentos cobertos, todos escolhidos pelo usuário:
  - **Os 18 testes do Vue**, reescritos com RTL e com os mesmos casos: Button, Checkbox, Radio, Collapse, Datepicker, Drawer, Dropdown, Input, Modal, MoneyInput, Pagination, Select, Steps, Switch, Table, Tabs, Tooltip e `utils/phone`.
  - **Render e variantes de cada `Ds*`.** Todo componente sem teste no Vue ganha ao menos render, variantes e estados (disabled, error, loading, quando existirem) e o callback principal (`onChange`, `onClick`, `onClose`...). As funções de máscara ganham testes de tabela (entrada → saída).
  - **Teclado e foco nos overlays.** Modal e Drawer prendem o foco, fecham com Esc e devolvem o foco ao gatilho. Dropdown, Select, FieldSelect e Tabs navegam por setas, Enter e Esc. Tooltip aparece no foco. Botão só de ícone tem nome acessível e tooltip.
  - **Tema e rota de dev.** `DsThemeToggle` aplica `data-theme="dark"` e `"light"` no `<html>`, grava a escolha, a reaplica ao montar e não quebra com `localStorage` indisponível. A rota `/design-system` só existe quando `DEV` é verdadeiro.
- Não se aplicam: o caso de outra clínica e o de papel sem permissão. Não há dado, API nem autorização envolvidos, porque o catálogo é uma página de dev sem login.
- Smoke test por fatia: abrir `/design-system` num navegador de verdade (Playwright ou Chrome DevTools), operar os componentes da fatia com mouse e teclado em light e dark, sem erro no console, e salvar os prints em `evidence/<tarefa>/frontend/<fluxo>/`. Na fatia 9, rodar o `npm run build` e mostrar que a rota não existe no bundle. O `SUMMARY.md` diz que o caso de outra clínica não se aplica e por quê.

## Fora do Escopo

- Migrar qualquer tela, layout ou componente da v1 para o DS.
- Colocar o `DsThemeToggle` em `AdminLayout`, `ClinicLayout` ou qualquer tela existente.
- Fazer a v1 reagir ao tema escuro.
- Trocar a paleta roxa do DS pela teal da v1.
- Storybook ou qualquer ferramenta de documentação além da rota de dev.
- Telas v2 propriamente ditas.
- Ícones Phosphor: foram trocados por lucide.

## Notas

- A pasta Vue tem origem no design system da Paytour. O usuário decidiu manter os valores visuais e tirar o nome.
- Fonte da verdade para conferir o visual: o SCSS de cada `.vue` e o `tokens.css` em `resources/design-system/`, até a fatia 9. As fatias precisam terminar antes de a pasta ser apagada.
- Os maiores componentes do Vue, que são os que mais pesam no esforço: `DsTable` (891 linhas), `DsDatepicker` (775), `DsFieldSelect` (769), `DsFieldSelectOptions` (634), `DsDropdown` (496) e `DsTimepicker` (419).
- O `app.css` atual tem um bloco `.dark` sem toggle. Ele não é usado pelo DS e fica como está.

## Desvios decididos na implementação

Registrados depois do plano. A skill `design-system` também traz cada um.

- **Selects:**
  - `DsSelect` é `<select>` nativo, como no Vue, e não Radix Select: aceita `multiple` e funciona com `register`.
  - `DsFieldSelect` usa o Popover do Radix com uma lista própria (`aria-activedescendant`), sem cmdk. O cmdk usa `aria-selected` para o item destacado, o que quebraria o modo multi.
- **Radio:** o `DsRadio` vive dentro de um `DsRadioGroup` novo, exigido pelo Radix e que dá a navegação por setas.
- **DsCollapse:** usa o Accordion do Radix (um item aberto por vez, como no Vue), e não o Collapsible.
- **Classes:** a junção é feita com o `dsCn` (tailwind-merge estendido com os nomes do DS), e não com o `cn` do SPA, que apagava `text-ds-*`.
- **Bandeiras:** viraram emoji.
- **Telefone e países:**
  - O telefone não usa libphonenumber: o Brasil tem formato completo, e os outros países, agrupamento genérico.
  - A lista de países é a tabela ISO → DDI, com os nomes vindos do `Intl.DisplayNames`.
- **Tema escuro:** fonte única (store com `useSyncExternalStore`), com o seletor `:root[data-theme='dark']`.
- **Tokens:** `--ds-surface-raised` ganhou valor no escuro (no Vue ficava branco).
- **DsTable:** a ordenação vai de asc para desc e depois para sem ordem (no Vue alternava só entre asc e desc). Isso fica para o usuário confirmar.
- **Configuração:** o `vitest.config.ts` exclui `.claude/**`, porque os `.test.cjs` da skill `security-audit` quebravam o `npm run test` já na `main`.
