# Recorrência: editar e excluir "este e os próximos"

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 63, 64
**Issue:** ainda não criada

## Descrição

Quando o aluguel muda de valor, a pessoa precisa mudar dali para frente sem estragar o histórico. A abordagem é dividir a série no ponto escolhido, como o Google Agenda, e registrar o modelo inteiro no ADR 026.

## O que construir

- `PUT` com `scope=following` numa ocorrência: a série antiga termina na ocorrência anterior (`ends_on`); nasce uma série nova a partir desta, com os dados novos; as futuras pendentes da série antiga vão para a lixeira e são geradas de novo na nova; as pagas/recebidas ficam. `scope=only` muda só esta.
- `DELETE` com `scope=following`: encerra a série (`ends_on`) e manda as futuras pendentes para a lixeira; o comando não gera mais.
- Modal: a pergunta "Só este / Este e os próximos" na edição e na exclusão de ocorrência.
- ADR 026 "Finanças: líquido, saldo encadeado e séries" em `docs/adr/`: líquido como base, saldo encadeado, série para parcela e recorrência e o corte em "este e os próximos", ids de paciente/atendimento por contrato, comprovante sem URL pública; paths REST iguais (ADR 006), semântica dos valores muda.

## Critérios de Aceite

- [x] Editar a ocorrência de março com `following` muda março em diante e mantém janeiro e fevereiro (teste)
- [x] Ocorrência futura já paga não muda (teste)
- [x] Depois da divisão, o comando gera na série nova e não na antiga (teste)
- [x] Excluir com `following` encerra: o comando não gera mais (teste)
- [x] Série de outra clínica → 404 (teste)
- [x] Modal pergunta "Só este / Este e os próximos" (Vitest)
- [x] ADR 026 escrito
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/017-recorrencia-editar-este-e-proximos/`

## Depende de

- `016-recorrencia-criar-e-gerar` (Recorrência: criar e gerar sozinha)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** série e comando da 016; ADR `docs/adr/025-editar-programa-nao-apaga-historico-e-troca-link-ao-trocar-paciente.md` (formato)
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-testing`, `domain-modeling`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A: aluguel mensal desde janeiro, janeiro e fevereiro pagos.
2. Abrir março, mudar o valor, "Este e os próximos": março em diante com o valor novo; janeiro e fevereiro iguais.
3. Abrir junho, excluir "Este e os próximos": junho em diante some (lixeira); rodar o comando: nada novo.
