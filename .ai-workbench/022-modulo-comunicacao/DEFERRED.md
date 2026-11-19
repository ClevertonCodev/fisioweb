# Adiado · 022 módulo de e-mail

- 2026-11-18 · escrever-plano · **A API de consultas devolve o paciente inteiro.** `GET/POST/PUT /api/clinic/appointments*` serializam a relação `patient` completa (CPF, endereço etc.; só a senha fica oculta). O front usa só id e nome (e, a partir da 022, e-mail e celular). Não veio da 022. Correção: devolver só os campos que a agenda usa, com teste.
- 2026-11-18 · criar-tarefas · **`AppointmentScheduledNotificationJob` só faz log.** Ele é despachado ao marcar consulta e tem um TODO de canal. Com a 022, o aviso ao paciente é a escolha no modal da agenda (tarefa 006), então o job ficou sem função. Correção: remover o job e o `assertPushed` do `AppointmentStoreTest`, se o usuário concordar.
