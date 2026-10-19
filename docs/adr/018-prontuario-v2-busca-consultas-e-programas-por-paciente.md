# ADR: O prontuário v2 busca consultas e programas filtrados por paciente na API

## Contexto

O protótipo do prontuário no design system v2 (`/clinica/pacientes/:id`, pasta `pages/clinic/patient/patient-record-prototype/`) foi aprovado na variante B, "Painel de acompanhamento". O painel mostra, para um paciente só:

- a próxima consulta e a última sessão realizada;
- sessões realizadas, comparecimento (%), faltas e o alerta de faltas seguidas;
- a frequência dos últimos 12 meses, com um ponto por consulta;
- os programas do paciente (aba Programas e o passo "Sem programa de exercícios").

As duas APIs que dão esses dados não eram usadas por paciente:

- `GET /api/clinic/appointments` aceita só `from`, `to`, `clinic_user_id` e `status` (`AppointmentController::index` → `AppointmentRepository::listForCalendar`). Não há `patient_id`. O `to` compara `starts_at <= to`, então uma data pura ("2026-10-19") deixa de fora o próprio dia 19.
- `GET /api/clinic/treatment-plans` **já filtra por `patient_id`** no backend (`TreatmentPlanRepository`, linha 41), mas o front não repassa o parâmetro: `ProgramListParams` não tem `patientId` e `apiClinicProgramsRepository.list` não manda `patient_id`. O `per_page` não tem teto.

Por isso o protótipo busca as consultas da clínica inteira entre 12 meses para trás e 6 para frente, e até 200 programas, e filtra pelo paciente no navegador. Isso traz a agenda de todos os pacientes para montar a tela de um, corta sem aviso a partir do 201º programa e faz os números do painel dependerem do tamanho da clínica.

## Decisão

Na tela de verdade, consultas e programas chegam filtrados pela API. Nada é filtrado por paciente no navegador.

1. **Consultas, backend (módulo ClinicScheduling).** O `index` aceita `patient_id`, validado como inteiro positivo, e o `listForCalendar` aplica `where('patient_id', ...)` junto com o `forClinic` que já existe. Um `patient_id` de outra clínica devolve lista vazia, nunca 403 nem 404, para não revelar que o id existe.
2. **Consultas, front.** `AppointmentListParams` ganha `patientId`, o repositório manda `patient_id`, e a `application/clinic` ganha um hook do prontuário (por exemplo, `usePatientAppointments(patientId, janela)`). A janela é de 12 meses para trás e 6 para frente, e o `to` vai como a meia-noite do dia seguinte ao último dia.
3. **Programas, front só.** `ProgramListParams` ganha `patientId` e o `apiClinicProgramsRepository.list` manda `patient_id`. O backend não muda.
4. **Números do painel.** Comparecimento, faltas seguidas, última e próxima consulta e tempo de acompanhamento são calculados numa função pura da `application/clinic`, com teste, a partir da lista já filtrada. Não ficam calculados dentro do componente.
5. **A regra da agenda do fisioterapeuta continua.** O `AppointmentService::listForUser` força o `clinic_user_id` do fisioterapeuta, então ele vê só as consultas que ele mesmo atendeu, também no prontuário. Para ele, o painel diz que os números são "suas consultas com este paciente". Abrir a agenda inteira do paciente para o fisioterapeuta é uma decisão de produto à parte, e só vale com mudança na Policy e no service, nunca no front.

## Consequências

- Benefícios:
  - A tela pede só o que mostra; o tamanho da resposta depende do paciente, não da clínica.
  - Nenhum programa some por causa do limite de 200.
  - O filtro por clínica continua no backend, que é a fonte de verdade.
- Custos:
  - Um parâmetro novo e testes no módulo ClinicScheduling.
  - Para o fisioterapeuta, o comparecimento e as faltas do painel não contam as consultas com outros profissionais. Enquanto o produto não decidir, a tela precisa deixar isso claro.
- Regras que agentes devem preservar:
  - Não filtrar consultas nem programas por paciente no navegador, nem aumentar `per_page` ou a janela de datas para contornar a falta de filtro.
  - Teste de feature do `patient_id` com: paciente da própria clínica (só as consultas dele), paciente de outra clínica (lista vazia) e fisioterapeuta (só as consultas dele com aquele paciente).
  - O `to` sempre como meia-noite do dia seguinte, enquanto a API comparar `starts_at <= to`.

## Alternativas descartadas

- Manter o filtro no navegador, como no protótipo: traz a agenda da clínica inteira, corta programas sem aviso e piora com o crescimento da clínica.
- Endpoint de resumo do paciente (`/patients/:id/care-summary`) com os números prontos: tira o cálculo do front, mas cria contrato entre módulos (Clinic, ClinicScheduling e TreatmentProgram) antes de a tela provar que precisa. Volta a ser opção se o cálculo pesar ou se outra tela precisar dos mesmos números.
- Rota aninhada `/patients/:id/appointments` no módulo Clinic: o prontuário passaria a ler dados internos do módulo ClinicScheduling, contra a fronteira entre módulos. O filtro fica com o dono dos dados.
