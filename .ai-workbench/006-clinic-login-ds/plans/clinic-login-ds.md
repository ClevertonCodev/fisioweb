# Plano · Login, recuperar e redefinir senha da clínica no DS v2

## Objetivo

As três telas públicas da clínica (`/clinica/login`, `/clinica/recuperar-senha`,
`/clinica/redefinir-senha`) saem da v1 e passam para o design system v2, na
variante A do protótipo (cartão no centro, marca IVS em cima). Junto, as falhas
de segurança e de uso que o estudo do protótipo achou são corrigidas.

## O que o estudo achou

1. **Senha errada recarregava a tela** (bug, front). O interceptor de 401 do
   `apiClient` trata qualquer 401 como sessão vencida: sem sessão, manda para o
   login com `window.location.href`, e a mensagem "Credenciais inválidas." nunca
   aparece; com sessão aberta, tenta renovar o token e repete o login sem limite.
2. **Sem limite de tentativas** (segurança, back). Nenhuma rota do sistema usa
   `throttle`; `login`, `forgot-password` e `reset-password` aceitam tentativas
   sem fim.
3. **A recuperação revela quem tem conta** (segurança, back). E-mail com conta
   recebe 200; sem conta, 400. O 429 do segundo pedido em 60 s também só
   aparece para quem tem conta. No redefinir, um token qualquer recebe
   "Token inválido" só se o e-mail tem conta (achado da revisão adversária).
4. **Usuário desativado entra** (segurança, back). O login não olha `status`.
5. **Botão "Continuar com Google" sem ação** (front). Não existe login com
   Google no back-end.
6. **Páginas importam `infrastructure/`** (regra do fisioweb). Recuperar e
   redefinir senha chamam `auth.service` direto.
7. **Formulários com `useState`** (regra do fisioweb): vão para RHF + Zod.

## Decisões

- Variante A do protótipo para as três telas. Telas públicas **sempre claras**:
  o tema é escolha de quem já entrou; ao sair delas volta o tema que estava.
- O botão do Google sai (achado 5).
- Recuperar senha responde **sempre** 200 com a mesma mensagem, com ou sem
  conta e também quando o broker segura um novo pedido (achado 3). A tela
  mostra "se houver uma conta com este e-mail…" e espera 60 s para reenviar.
  Redefinir com link errado também responde igual com ou sem conta ("Link
  inválido ou expirado"); antes, só quem tinha conta recebia "Token inválido".
- Limite por minuto: login 5 por e-mail + IP; recuperar e redefinir 5 por
  rota e IP (pedir links não gasta as tentativas de redefinir). O 429 do
  limite traz mensagem em português e `Retry-After`.
- Usuário com `status` diferente de 1 recebe 403 "acesso desativado" depois da
  senha certa; o token emitido é invalidado na hora.
- O interceptor de 401 ignora as rotas `/auth/login`, `/auth/forgot-password`
  e `/auth/reset-password` (vale para admin e clínica).

## Fora do escopo (vai para o DEFERRED.md)

- Telas de login e senha do admin (continuam v1 e importando `infrastructure/`).
- Tokens já emitidos para um usuário que depois foi desativado continuam
  valendo até expirar (precisa de checagem no middleware ou no refresh).
- Clínica inativa ou sem assinatura não é barrada no login.

## Tarefas

1. `001-backend-auth-seguro`: limite de tentativas, recuperação neutra e
   usuário inativo barrado (achados 2, 3, 4).
2. `002-api-client-401-auth`: 401 das rotas de autenticação vai para a tela
   (achado 1).
3. `003-telas-auth-v2`: as três telas no DS v2, RHF + Zod, camada
   `application/`, sempre claras, sem Google (achados 5, 6, 7).

## Verificação

- PHPUnit: `modules/Clinic/tests` e `modules/Admin/tests` (o controlador base
  é compartilhado).
- Vitest: testes novos das três telas e do interceptor.
- Smoke test: as três telas no navegador (computador e celular) e os endpoints
  por HTTP (senha certa, errada, inativo, limite, recuperação com e sem conta).
- `bash bin/verificar.sh` e revisão adversária.
