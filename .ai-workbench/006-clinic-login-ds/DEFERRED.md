# Fora do escopo · 006-clinic-login-ds

- 2026-10-18 · plano · As telas de login e senha do admin continuam v1, sem
  limite de tentativas na rota e importando `infrastructure/` direto da página.
- 2026-10-18 · plano · Token já emitido para um usuário da clínica que depois
  foi desativado continua valendo até expirar (o login barra, mas o
  middleware e o refresh não olham `status`).
- 2026-10-18 · plano · Clínica inativa ou sem assinatura não é barrada no
  login da clínica.
