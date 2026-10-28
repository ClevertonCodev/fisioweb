# Adiado — 010 formulários do prontuário

- Área (especialidade) e indicação pelo diagnóstico ainda são deduzidas
  do nome do modelo. Ficam no cadastro do modelo quando existir campo.
- Seed de avaliação com texto em campo `number`; validar o tipo no
  backend.
- Página do paciente para responder o questionário pelo link.
- Conferir se as rotas públicas antigas de questionário por id
  sequencial ainda existem depois do token.
- "Criar questionário" (`/clinica/questionarios/novo`) promovido a tela v2
  (banco de perguntas); banco ainda fixo no front; editar template continua v1.
- Validação de escala no editor (`scaleMax` mínimo 1) e migração para RHF+Zod
  no builder de questionário (dívida herdada da v1).
