# Adiado · 007-clinic-usuarios-ds

- 2026-10-20 · 001/002 · O sinal de verificação em duas etapas fica fora da tela (cartão, drawer e o trecho "N sem verificação em duas etapas" do resumo), porque o 2FA não existe no backend e o ADR 019 proíbe tela que ofereça 2FA antes disso. A API e o mapper já mandam `two_factor_confirmed_at` / `twoFactorEnabled`: quando o 2FA existir, é só ligar o sinal de volta. Decisão do usuário.
- 2026-10-20 · 002 · O botão "Pedir para ativar as duas etapas" do protótipo não entra: não há endpoint (nem 2FA).
- 2026-10-20 · 002 · Contadores de carga (pacientes, programas, agenda da semana) continuam agregados no front, com o limite de 200 e o paciente casado pelo nome do profissional. Contadores no backend ficam para depois.
- 2026-10-20 · 003/004 · O administrador consegue mudar a própria função, se desativar ou se excluir quando há outro admin ativo (a API permite; a tela não trava). Ao fazer isso, perde a tela na hora. Fora do plano; decidir se vira regra no backend.
- 2026-10-20 · 004 (revisão) · Excluir virou soft delete (ADR 022). O e-mail de quem foi excluído continua ocupado: não dá para recadastrar a pessoa com o mesmo e-mail nem restaurá-la pela tela. Falta um "restaurar" ou liberar o e-mail.
- 2026-10-20 · 004 (revisão, rodada 2) · Desativar não revoga o token: o guard recusa o inativo, mas se ele for reativado antes do `exp` o token antigo volta a valer (ADR 022). Se for preciso cortar de vez, guardar `sessions_invalidated_at` e recusar tokens com `iat` anterior.
- 2026-10-20 · 002 (revisão, rodada 2) · "Agenda da semana" do drawer manda datas locais (`AAAA-MM-DD`) e a API compara com timestamps em UTC: perto da meia-noite de domingo a consulta cai na semana vizinha. Resolver junto com os contadores de carga no backend.
