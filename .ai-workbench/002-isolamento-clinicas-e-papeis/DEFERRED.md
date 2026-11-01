# Adiado · 002 Isolamento entre clínicas e papéis

- **Histórico do paciente na agenda v2 (feature 005).** O endpoint `GET /api/clinic/patients/{patient}/appointments` deixa o fisioterapeuta ver o histórico completo de um paciente com quem ele tem ao menos uma consulta não cancelada. Ao implementar a tarefa 013 ("fisio vê só os pacientes dele"), decidir se essa regra passa a ser "paciente acessível" (responsável ou vínculo em `patient_care_links`). Registrado em 2026-10-17.
