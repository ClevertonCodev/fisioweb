# QA mestre: guia rápido

A skill `qa-mestre` confere se uma entrega faz o que os critérios de aceite
prometem, com um testador que não vê o diff, e diz se ela pode pular o QA
humano. A regra completa está em `docs/ai-harness/DEFINICAO_DE_QA.md`; o passo a
passo do agente, em `.claude/skills/qa-mestre/SKILL.md`.

## Como chamar

No Claude Code ou no Cursor, na pasta da entrega (checkout principal ou
worktree do `fisio-app`), com o ambiente no ar:

| Você digita | O que roda | Custo aproximado |
|---|---|---|
| `/qa-mestre` | pergunta quais modos rodar, com o custo de cada um | — |
| `/qa-mestre testes` | lê e roda os testes automatizados (PHPUnit/Vitest) dos critérios | ~60 mil tokens |
| `/qa-mestre tela` | confere os critérios de tela e de API, com vídeo | ~80 a 120 mil por tela |
| `/qa-mestre prototipo` | compara a tela com o protótipo e com o checklist de tela v2 | ~50 a 100 mil por tela |
| `/qa-mestre quebrar` | campos inválidos por tipo (`campos.mjs`) e até 5 tentativas de quebrar | ~30 a 50 mil por tela |
| `/qa-mestre acesso` | papel, outra clínica e outro paciente, com usuários QA | ~60 a 80 mil |
| `/qa-mestre testes tela` | junta modos | a soma |

- O resultado fica em `.ai-workbench/<feature>/qa/<alvo>/QA.md`, que acumula os modos.
- A recomendação (pular ou não o QA humano) só sai depois de `testes` e `tela`
  (e `acesso`, se houver critério de papel, de outra clínica ou de paciente).
  Antes disso o QA é "parcial".
- O agente sempre pergunta o **id da clínica** antes de criar usuários.

## Ferramentas desta pasta

Rode na raiz da pasta da entrega. Numa worktree, ponha `fisio-app exec` antes
do `php`.

### `usuarios.php`: usuários de teste

```bash
# um usuário em cada papel (administrador, fisioterapeuta, secretária) na clínica <id>
php tools/playwright/qa-mestre/usuarios.php clinica --clinica <id> --alvo 003-papel-secretaria

# só alguns papéis
php tools/playwright/qa-mestre/usuarios.php clinica --clinica <id> --alvo 003-papel-secretaria --papeis secretaria

# outra clínica, com o administrador mestre e senha conhecida (o plano decide as funcionalidades)
php tools/playwright/qa-mestre/usuarios.php outra-clinica --alvo 003-papel-secretaria --plano Start

# pacientes (login com o CPF; a senha é o CPF, como no cadastro de verdade)
php tools/playwright/qa-mestre/usuarios.php pacientes --clinica <id> --alvo 003-papel-secretaria --quantos 2

# operador do admin
php tools/playwright/qa-mestre/usuarios.php operador --alvo 003-papel-secretaria

# no fim: exclui (soft delete) tudo o que o alvo criou
php tools/playwright/qa-mestre/usuarios.php limpar --alvo 003-papel-secretaria
```

Roda de novo sem duplicar (reativa e troca a senha). Devolve um JSON com login,
senha e onde entrar. Só mexe no que tem e-mail `qa-<alvo>--*@exemplo.test`, e
recusa rodar com `APP_ENV=production`. Um id de clínica que não existe lista as
clínicas.

### `campos.mjs`: campos inválidos por tipo

```bash
# tela de uma página
node tools/playwright/qa-mestre/campos.mjs 'http://localhost:8000/clinica/pacientes/novo'

# modal ou assistente com etapas: abre com --click e passa por cada --etapa
node tools/playwright/qa-mestre/campos.mjs 'http://localhost:8000/clinica/programas/novo' \
  --etapa 'text=Avançar' --etapa 'text=Avançar'
```

Acha os campos sozinho, adivinha o tipo, digita os inválidos e mostra só os
**SUSPEITOS** (o inválido ficou, sem erro). Não grava nada: toda requisição de
escrita é barrada. Tipo errado: `--tipo 'Rótulo do campo=percentual'`. Resultado
completo: `--saida arquivo.json`.

| Tipo | O que tenta |
|---|---|
| número | `abc`, `-5`, `1,5`, `99999999999` |
| percentual | `abc`, `-5`, `150`, `1,5` |
| dinheiro | `abc`, `-10`, `10,999` |
| data | `32/13/2026`, `abc` |
| máscara (CPF, CNPJ, telefone, CEP, CREFITO) | `abcdef`, `123` |
| e-mail | `abc`, `abc@` |
| texto | 300 caracteres, só espaços |

## Login

Tudo usa `tools/playwright/credentials.json` (fora do git; modelo em
`credentials.exemple.json`), com um usuário por guard:

```json
{
  "clinic": { "email": "...", "password": "..." },
  "admin":  { "email": "...", "password": "..." }
}
```

O guard sai da URL (`/clinica` ou `/admin`). `FISIO_LOGIN` e `FISIO_SENHA`
passam por cima de tudo (usuário QA). A área do paciente não tem login
automático: o roteiro entra com o CPF.
