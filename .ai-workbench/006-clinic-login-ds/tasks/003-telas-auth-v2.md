# 003 · Login, recuperar e redefinir senha no DS v2

**Plano:** [../plans/clinic-login-ds.md](../plans/clinic-login-ds.md)

## Critérios de aceite

- [x] As três telas usam só `@/components/ds` (nada de `components/ui`), na
      variante A: marca IVS, cartão no centro, links e suporte embaixo.
- [x] Formulários em RHF + Zod; recuperar e redefinir chamam a API pela camada
      `application/`, não por `infrastructure/`.
- [x] Login: erro da API (senha errada, acesso desativado, limite) aparece no
      cartão sem recarregar; aviso de Caps Lock; "Esqueci minha senha" e
      "Criar conta da clínica".
- [x] Recuperar: depois de enviar, a mesma mensagem com ou sem conta,
      "Abrir o Gmail/Outlook" e reenviar só depois de 60 s.
- [x] Redefinir: sem token ou e-mail no link mostra "link inválido" com saída
      para pedir outro; senha (mín. 8) e confirmação iguais; token vencido
      mostra o erro e o caminho para pedir outro link; sucesso leva ao login.
- [x] Telas sempre claras; ao sair delas volta o tema que estava.
- [x] Sem botão do Google.
- [x] Rola em tela baixa (1359 × 543) e cabe no celular (375 px), sem rolagem
      lateral.
- [x] Protótipo `auth-prototype` e a troca por `?variant=` removidos.
- [x] Testes das três telas.
