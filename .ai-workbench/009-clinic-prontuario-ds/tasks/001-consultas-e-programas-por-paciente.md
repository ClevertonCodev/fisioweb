# Consultas e programas por paciente, e os números do painel

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-ds.md`
**Issue:** ainda não criada

## Descrição

O protótipo do prontuário busca a agenda da clínica inteira (12 meses para trás e 6 para frente) e até 200 programas, e filtra pelo paciente no navegador. Isso traz dado de todo mundo para montar a tela de um, corta programa sem aviso e faz os números dependerem do tamanho da clínica. O ADR 018 proíbe esse atalho na tela de verdade.

Esta fatia cumpre o ADR 018: a API de consultas aceita `patient_id`, o front manda `patient_id` também nos programas (o backend já filtra), e os números do painel saem de uma função pura testada. Ainda não troca a tela.

## O que construir

- **Dono:** módulo `ClinicScheduling` no filtro de consultas. Programas: só o front, módulo `TreatmentProgram` já filtra. Números: `application/clinic`.
- **Consultas:** o index aceita `patient_id` (inteiro positivo) e o `listForCalendar` aplica o filtro junto do `forClinic`. Paciente de outra clínica ou inexistente: lista vazia, 200, nunca 403 nem 404. Fisioterapeuta: o service continua forçando o `clinic_user_id` dele.
- **Janela:** 12 meses para trás e 6 para frente. O `to` vai como meia-noite do dia seguinte ao último dia, enquanto a API comparar `starts_at <= to`.
- **Front:** `AppointmentListParams` e `ProgramListParams` ganham `patientId`; os repositórios mandam `patient_id`. Hook do prontuário (`usePatientAppointments`) pede a janela. Hook de programas do paciente manda `patientId` e, se houver mais de uma página, pede as seguintes — sem inflar `per_page` para contornar.
- **Números:** função pura (comparecimento, faltas, faltas seguidas, próxima, última, tempo de acompanhamento, programa ativo) a partir da lista já filtrada, com teste. Não calcula dentro de componente.
- **Sem tela nova, sem migration, sem fila.**

## Critérios de Aceite

- [ ] `GET /api/clinic/appointments?patient_id=` do paciente da própria clínica devolve só as consultas dele (teste de feature).
- [ ] O mesmo `patient_id` de outra clínica devolve lista vazia com 200, sem 403 nem 404 (teste).
- [ ] Fisioterapeuta com `patient_id` vê só as consultas dele com aquele paciente (teste).
- [ ] `patient_id` inválido (zero, negativo, não numérico) devolve 422 (teste).
- [ ] O repositório de consultas manda `patient_id` no query string (teste do mapper).
- [ ] O repositório de programas manda `patient_id` no query string (teste do mapper).
- [ ] A função pura dos números cobre lista vazia, só canceladas, faltas seguidas, próxima e última, comparecimento e programa ativo (teste Vitest sem render).
- [ ] Nenhum código novo filtra consultas ou programas por paciente no navegador, nem aumenta `per_page` ou a janela para contornar (revisão do diff).
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. Pode correr em paralelo com a `002-token-do-questionario`.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-ds`
- **Exemplo no código:** `AppointmentIndexVisibilityTest`; `listForCalendar` e `listForUser` em ClinicScheduling; `api-clinic-appointments.test.ts` e `api-clinic-programs.test.ts`.
- **Skills:** `architecture-paradigm-modular-monolith`, `php-testing`, `api-client`, `frontend-ddd`, `frontend-testing`.
- Não criar rota aninhada `/patients/:id/appointments` no módulo Clinic (alternativa descartada no ADR 018). O `historyForPatient` da agenda não é este endpoint e não muda.
- O aviso “suas consultas com este paciente” para o fisioterapeuta entra na tarefa 003, quando a tela existir. Aqui a API e a função já devolvem o recorte certo.

## Como testar na mão

1. Entre como admin da clínica A. Crie duas consultas no mesmo paciente e uma em outro paciente.
2. `GET /api/clinic/appointments?patient_id={id}&from=...&to=...` (o `to` um dia depois do fim da janela) deve trazer só as duas daquele paciente.
3. Entre como fisioterapeuta que atendeu só uma dessas duas: a mesma URL traz só a dele.
4. Entre como usuário da clínica B e chame a URL com o `patient_id` da clínica A: lista vazia, 200.
5. Confira no DevTools do protótipo (ainda em dev) que, depois desta fatia, as requests de consultas e programas já levam `patient_id` — mesmo que a tela ainda filtre, o parâmetro já vai. A tela para de filtrar na tarefa 003.
