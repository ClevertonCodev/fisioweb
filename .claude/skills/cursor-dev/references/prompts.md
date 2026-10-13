# Templates de prompt para o Cursor

Preencher os `<...>`. Ser específico: caminhos exatos, nomes de classes/métodos, casos de teste esperados. O Cursor não vê esta conversa.

## Tarefa (dev)

```markdown
# Tarefa: <título curto>

## Contexto
<1-3 frases: o que existe hoje e por que a mudança. Citar spec/plan se houver: specs/<feature>/plan.md, task T0XX.>

## Objetivo
<o comportamento final esperado, observável>

## Arquivos
Criar:
- <caminho> — <responsabilidade>
Alterar:
- <caminho> — <o que muda>

Fora de escopo (NÃO alterar): <arquivos/áreas>

## Skills obrigatórias (ler o SKILL.md antes de codar)
- .cursor/skills/<skill>/SKILL.md

## Decisões já tomadas
- <nomes, assinaturas, rota, payload, regra de negócio — o que o engenheiro já decidiu>

## Testes obrigatórios
- <arquivo de teste> — casos: <caso 1>, <caso 2>, <caso de autorização/erro>

## Critérios de aceite
- [ ] <critério verificável>
- [ ] Testes novos passam
- [ ] `./vendor/bin/pint --test`, `npm run types`, `npm run lint` sem erros nos arquivos tocados

## Regras
- Não commitar, não fazer push, não criar branch.
- Não alterar arquivos fora da lista sem necessidade; se precisar, explicar no relatório.
- Não rodar migrate:fresh, db:wipe nem instalar dependências.
- Rodar os testes que você escreveu antes de terminar.

## Relatório final (responda exatamente neste formato)
ARQUIVOS: <lista de arquivos criados/alterados>
TESTES: <comando rodado> → <passou/falhou, contagem>
DESVIOS: <o que fez diferente do pedido e por quê, ou "nenhum">
DÚVIDAS: <pontos ambíguos, ou "nenhuma">
```

## Ajuste

```markdown
# Ajustes na tarefa anterior

Revisei o diff. Corrija os itens abaixo e mantenha o resto como está.

1. <arquivo:linha> — <problema> → <o que deve ser>
2. ...

Arquivos revertidos por estarem fora do escopo: <lista ou "nenhum">

Rode novamente: <comandos de teste>
Responda no mesmo formato de relatório final.
```

## Review

Texto de foco passado ao `review.mjs` (o script já coleta o diff). Uma linha só, entre aspas:

```
Objetivo: <1-2 frases>. Aplique as regras de .cursor/commands/code-review.md (escopo clinic_id, Policy, guard JWT, fronteira entre módulos, apiClient, N+1, testes). Cada achado precisa de cenário concreto (entrada → resultado errado → esperado) e de um teste que o prove.
```
