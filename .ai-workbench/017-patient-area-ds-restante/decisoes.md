# Decisões — área paciente DS v2 (contexto para as 3 telas restantes)

| ID | Decisão |
|----|---------|
| D1 | Marca na área paciente: **IVS Fisioterapia e Saúde** (igual clínica), não “Fisioweb”. |
| D2 | Navbar paciente v2: **`DsPatientNavbar`** + badge **`showPrototypeBadge`** enquanto a migração da área não fechar. |
| D3 | Container scroll: `h-full w-full flex flex-col overflow-y-auto bg-ds-surface-body font-ds`. |
| D4 | Vídeos de exercício na jornada: **aspecto quadrado 1:1** (Instagram), alinhado detalhe programa + execução. |
| D5 | Protótipos: usuário escolhe A/B/C → consolidar na page → apagar pasta `*-variants/`. Feedback **B**; execução **A**; login **A**; detalhe programa **B**. **Lista de programas: C** (preview com `?variant=C`; rota normal permanece v1 até consolidar). |
| D6 | Tokens de sucesso: usar utilitários de `tokens.css` (`ds-status-success-*`, `ds-success-100`, etc.). |
| D7 | Escopo destas 3 telas: **só frontend**, sem API/migration/Policy. |

## Sessão 2026-11-05

Corte v2: a variante escolhida vira a rota oficial e o lixo de protótipo sai. Substitui, em D5, o trecho em que a lista C ficava só no `?variant=C` e a rota normal permanecia v1.

- **Quem usa** → o paciente, nas sete rotas que já existem. Sem papel novo e sem mudança de quem vê o quê.
- **Isolamento** → o corte não mexe em rota, API, backend nem Policy. O paciente continua vendo só o próprio programa pelos hooks atuais.
- **Onde vive** → as pages oficiais em `resources/js/pages/patient/`. Sem módulo novo. Página não importa `apiClient`; dados por `@/application/patient/`.
- **Dados, fila, plano** → sem migration, sem job, sem funcionalidade de plano.
- **Login, detalhe do programa, executar, feedback** → já são A, B, A e B na page oficial. Só auditar: não reescrever. Auditoria desta sessão: as quatro usam `DsPatientNavbar` com `showPrototypeBadge` e o layout `h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds`; não importam `@/components/ui/*`; não há pasta `*-variants/`, `execution-variants/` nem `feedback-variants/`.
- **Lista** → a variante C vira `PatientProgramListPage.tsx` (hooks `usePatientPrograms` e navegação `patientProgramDetailPath`, como o wrapper de hoje). Sem `useSearchParams`, sem `?variant=` e sem a v1. Apagar `PatientProgramListPageV1.tsx` e a pasta `program-list-prototype/`.
- **Detalhe do exercício** → o corpo de `PatientExerciseDetailPageV2B.tsx` vira `PatientExerciseDetailPage.tsx` (um default export; params e hooks no mesmo arquivo). Sem `PrototypeSwitcher` e sem v1. Apagar `PatientExerciseDetailPageV1.tsx` e `PatientExerciseDetailPageV2B.tsx`. Vídeo segue 1:1 (D4).
- **Programa concluído** → o corpo da variante A vira `PatientProgramSuccessPage.tsx`. CTA “Voltar aos programas” com `patientProgramsListPath`. Sem switcher, sem `?variant=` e sem o Original teal. Apagar a pasta `program-success-prototype/`. A variante A é tela imersiva, fundo `--ds-gradient-brand`, sem `DsPatientNavbar` — isso fecha a dúvida de navbar da tarefa 003.
- **Marca e badge** → marca continua **IVS Fisioterapia e Saúde** (D1). `showPrototypeBadge` fica (D2). Tirar o badge “Protótipo” continua fora deste corte.
- **Limpeza nas pages oficiais** → nas sete pages: zero `@/components/ui/*`, zero `PrototypeSwitcher`, zero `?variant=`, zero import de `*-prototype*` ou `*PageV1`.
- **Teste do corte** → `resources/js/test/patient-area-v2-cut.test.ts`, no padrão de `program-detail-v2-cut.test.ts`, cobrindo as sete pages e as rotas `auth-routes.tsx` e `program-routes.tsx`. Atualizar teste que importava arquivo apagado.
- **Como saber que funcionou** → o teste de corte passa; `npm run types` e `bash bin/verificar.sh` passam; cada URL da jornada abre a variante escolhida sem query.
- **Commit** → não commitar este corte a menos que o usuário peça.

### Fora do escopo

- Tirar `showPrototypeBadge` das pages do paciente.
- Rotas em `resources/js/routes/patient/*`, API, backend e Policies.
- `MetricTile`, `SeriesTracker` e `SessionTrack`: ninguém importa, mas não estão na lista de apagar deste corte.

## Sessão 2026-11-05

- **Navbar v1 depois do corte** → apagar `PatientNavbar.tsx` e `resources/js/test/patient-navbar.test.tsx` juntos. O usuário escolheu a opção 1: a navbar v1 deixa de ter tela, e o teste dela não protege mais nenhuma rota. O `DsPatientNavbar` já tem teste próprio. (Fecha o item em aberto da sessão anterior sobre manter ou apagar os dois.)

### Fora do escopo

- Nada novo.

### Em aberto

- (vazio)

## Sessão 2026-11-05 — implementação

- **Nome da clínica no exercício** → a história 34 pede o nome da clínica na navbar do exercício, junto com o título. O `DsPatientNavbar` recebia `clinicName` e escondia o badge sempre que havia título. A navbar passa a mostrar o badge sempre que `clinicName` vem preenchido, também no modo com título. Execução não passa `clinicName`, então a tela dela não muda. Detalhe do programa não usa título na navbar e já mostrava a clínica.
- **Sem ADR** → a dúvida cabia na decisão da história 34 e no componente que as telas já compartilham. Não há fronteira nova, contrato nem mudança de API.
- **Faixa do login** → a auditoria achou, na page oficial do login, uma faixa “Protótipo em Validação” com o selo “Opção A”. O formulário já era a variante A. A faixa saiu. O badge Protótipo da navbar fica. O teste de corte passa a barrar “Opção A/B/C” e “Protótipo em Validação” nas sete pages e nas duas rotas.
- **Branch** → `feat/implementas-ds-telas-pacit`, pedida pelo usuário. Sem issue no GitHub.
- **`bash bin/verificar.sh`** → com `TZ=America/Sao_Paulo`, ESLint, Prettier, TypeScript e o build passam. O Vitest fica 1581 verdes e 1 vermelho: `ExerciseLibraryPage` (“Criar programa” aparece duas vezes). Esse arquivo não está no diff. Em UTC, dois testes de finanças também falham porque esperam 09:00 e a VM devolve 12:00. Não foram alterados.
- **Data do card** → `Y-m-d` vira data civil (`ano, mês, dia`) antes do `pt-BR`. `new Date('YYYY-MM-DD')` é meia-noite UTC e, em São Paulo, mostra o dia anterior. O detalhe do programa ainda faz o parse antigo; ficou no `DEFERRED.md`.
- **“Quando fazer” vazio** → a condição da seção é booleana. Comprimento `0` no JSX desenhava o dígito 0.
