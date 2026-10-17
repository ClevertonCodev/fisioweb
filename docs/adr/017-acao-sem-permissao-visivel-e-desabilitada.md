# ADR: Ação sem permissão aparece desabilitada, com o motivo, em vez de sumir

## Contexto

Na lista de pacientes v1, "Inativar paciente" aparecia para todos os papéis, e o fisioterapeuta recebia 403 ao clicar. Ao trazer a ação para o cartão da v2 (feature `005-clinic-pacientes-ds`), havia três caminhos: esconder o botão de quem não pode, mostrar desabilitado ou liberar o papel no backend. Esconder muda a grade do rodapé conforme o papel e deixa o fisioterapeuta sem saber que a ação existe nem a quem pedir. O usuário escolheu mostrar desabilitado.

## Decisão

Uma ação que o papel do usuário não pode fazer continua visível no mesmo lugar, desabilitada, com o motivo num tooltip. Exemplo: "Apenas admin ou secretária podem inativar pacientes".

- O botão usa `aria-disabled="true"` (não o atributo `disabled`) e não tem `onClick`. Assim ele continua recebendo foco e hover: o tooltip chega a quem usa mouse, teclado ou leitor de tela, e Enter ou clique não fazem nada.
- A regra de "pode ou não pode" vem de `permissions.ts` (`can.*`), com o papel do `useAuth`, e espelha a Policy do backend. É só UX: quem protege é o backend, que continua devolvendo 403.
- Na lista de pacientes vale para inativar (`can.bulkInactivate`) e reativar (`can.reactivate`), com textos próprios.

## Consequências

- Benefícios:
  - O fisioterapeuta entende por que não consegue e a quem pedir.
  - O layout é o mesmo para todos os papéis.
  - O motivo é acessível pelo teclado, o que não aconteceria com `disabled`, porque botão desabilitado não recebe foco nem hover.
- Custos:
  - O botão precisa de estilo próprio de desabilitado (`aria-disabled`), porque as variantes `disabled:` do Tailwind não se aplicam.
  - Os testes conferem `aria-disabled`, não `toBeDisabled()`.
- Regras que agentes devem preservar:
  - Ação negada por papel em tela v2: `aria-disabled` + tooltip com o motivo, nunca `disabled` sozinho.
  - O botão desabilitado nunca chama a ação. O teste confere que clique e Enter não abrem nada.
  - Toda ação desabilitada no front tem o endpoint protegido por Policy, com teste de 403.
  - Esconder continua certo quando a área inteira não é do papel (por exemplo, telas só de admin com `RequireClinicAdmin`). Este ADR vale para ações dentro de uma tela que o papel usa.

## Alternativas descartadas

- Esconder o botão para o fisioterapeuta: a grade do rodapé muda conforme o papel e a ação fica invisível para quem precisa pedir.
- `disabled` com o tooltip num `span` em volta (primeira versão desta feature): funciona no hover, mas não pelo teclado. Trocado na revisão adversária.
- Liberar inativar e reativar para o fisioterapeuta: muda a regra de negócio, e o usuário não quis.
