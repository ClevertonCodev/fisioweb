# Usar o modal "Enviar ao paciente" no fim do assistente de programa

**Tipo:** História
**Plano:** `../plans/modulo-comunicacao.md`
**Histórias:** 1, 3, 4, 5, 6
**Issue:** ainda não criada

## Descrição

Ao salvar um programa no assistente, abre hoje o diálogo "Programa enviado", com Copiar link, WhatsApp e E-mail pelo `mailto:`. Esta tarefa troca esse diálogo pelo modal "Enviar ao paciente" (variante C) da tarefa 002, para o fisioterapeuta mandar o programa por e-mail pelo servidor logo que salva.

## O que construir

- **No fim do assistente** (criar, editar, usar modelo), depois de salvar um programa com paciente, abre o modal C com E-mail, WhatsApp e Copiar link.
- **Fases que continuam:** "Salvando programa…" e "Não foi possível salvar" (com "Voltar e corrigir") ficam como hoje. Só o estado "pronto" vira o modal C.
- **"Concluir"** leva aonde o "Concluir" leva hoje.
- **Modelo de programa** (sem paciente) não abre o modal de envio; segue como hoje.
- **O `mailto:` do assistente sai.** O endpoint é o da tarefa 002: mesmo guard, papéis, filtro por `clinic_id` e limite.
- **Sem backend novo e sem migration.**

## Critérios de Aceite

- [x] Salvar um programa com paciente no assistente abre o modal C. Enviar o e-mail mostra "Enviado <hora>" e chama o endpoint do programa (Vitest com o repositório mockado).
- [x] Paciente sem e-mail: o botão de e-mail fica desabilitado com "Paciente sem e-mail cadastrado"; WhatsApp e Copiar link continuam funcionando.
- [x] As fases de salvar e de erro continuam como antes (os testes atuais do assistente passam).
- [x] Salvar um modelo de programa não abre o modal de envio.
- [x] Não sobra uso de `mailto:` no assistente.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-programa-por-email-no-detalhe` (endpoint e componente do modal C).

## Notas de Implementação

- **Branch:** `feat/modulo-comunicacao`
- **Exemplo no código:** o `ShareDialog` dentro de `DetailsStep.tsx` do assistente de programa (fases saving, ready e error) e os testes do assistente.
- **Skills:** `frontend-react`, `design-system`, `frontend-testing`.

## Como testar na mão

1. Como fisioterapeuta da clínica A, crie um programa em `/clinica/programas/novo` para um paciente com seu e-mail.
2. Ao salvar, abre "Enviar ao paciente". Clique em "Enviar" no E-mail: o e-mail chega.
3. Edite o programa trocando o paciente: o modal mostra o link novo.
4. Crie um modelo de programa: o modal de envio não aparece.
