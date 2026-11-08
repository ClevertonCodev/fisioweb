---
name: implementar-tarefa
description: Implementa uma tarefa de .ai-workbench/<feature>/tasks/ (ou descrita na conversa) com teste primeiro, no ciclo vermelho-verde-refatorar, e só termina quando a Definição de Pronto passa, incluindo smoke test e revisão adversária. Quarta etapa do ciclo (refinar, escrever-plano, criar-tarefas, implementar-tarefa, revisao-adversaria). Use quando pedirem para implementar uma tarefa, corrigir um bug com teste ou trabalhar com TDD.
---

# Implementar tarefa

Implemente a tarefa com o teste vindo primeiro. A tarefa só termina quando a
Definição de Pronto (`docs/ai-harness/DEFINITION_OF_DONE.md`) passa.

## O que é um bom teste

Um bom teste confere **comportamento pela porta da frente**: chama o endpoint
(`$this->actingAs($user, 'clinic')->getJson(...)`) ou o método público com
dados de verdade e confere o resultado. Ele descreve *o que* o sistema faz, não
*como*, e continua passando se alguém reorganizar o código por dentro.

Um teste ruim depende de detalhe interno: faz mock de uma classe do próprio
fisioweb que podia rodar de verdade, testa método privado, ou quebra quando
alguém só renomeia uma função. Mock é para a fronteira externa (R2, Twilio,
Google, fila): use `Storage::fake`, `Queue::fake`, `Http::fake`.

Copie o estilo de um teste parecido que já existe em `modules/<Modulo>/tests/`
ou `resources/js/test/`, e siga a skill `php-testing` (backend) ou
`frontend-testing` (frontend).

## Um teste por vez

**Nunca escreva todos os testes primeiro e todo o código depois.** Testes
escritos em bloco testam o comportamento que você imaginou, não o que o código
faz.

```
ERRADO:  teste1, teste2, teste3  →  código1, código2, código3
CERTO:   teste1 → código1,  teste2 → código2,  teste3 → código3
```

## Inclua sempre o caso de outra clínica

Todo endpoint, query ou Policy que a tarefa cria ou altera ganha um teste em que
um usuário da **clínica B** tenta usar um recurso da **clínica A**:

- ler pelo id e alterar ou apagar: resposta 404 ou 403, e o dado da A continua
  igual no banco;
- listar ou buscar: o recurso da A não aparece no resultado;
- enviar um `clinic_id` ou `patient_id` da A no corpo: a requisição é recusada.

Na área do paciente, o mesmo vale entre pacientes: o paciente B não vê nem
altera nada do paciente A.

Esse teste não fica para o fim: entra na lista do passo 1 e roda no ciclo
vermelho-verde como os outros. Tarefa só de frontend, sem endpoint novo nem
alterado, diz no relatório qual teste de outra clínica já cobre o endpoint que a
tela usa. Se esse teste não existir, ele faz parte da tarefa.

## Passo a passo

### 0. Prepare

- Leia o `README.md` da feature, a tarefa, o plano de onde ela veio e a
  Definição de Pronto. Correção pequena sem feature: crie
  `.ai-workbench/NNN-<slug>/` só com o `README.md` e use `000-<slug>` como
  tarefa (seção "Pasta de trabalho" da Definição de Pronto).
- Carregue as skills da área (tabela "Skill Map" do `AGENTS.md`), por exemplo
  `architecture-paradigm-modular-monolith` + `backend-clean-code` + `security-audit` + `php-testing` para endpoint novo, ou
  `frontend-ddd` + `forms-shadcn` + `frontend-testing` para tela v1 (para tela v2, `design-system` no lugar de `forms-shadcn`).
- Sem branch da tarefa, sugira `feat/<slug>` (ou `bugfix/<slug>`) a partir da
  `main` e espere o usuário confirmar.
- Marque a tarefa como `em andamento` no `README.md` da feature.
- Se existir evidência de tarefa que já teve a PR aceita, lembre o usuário de
  apagar (`.ai-workbench/<feature>/evidence/<tarefa>/` e `review/<tarefa>/`).

### 1. Planeje com o usuário

- Quais classes, métodos, endpoints ou páginas vão mudar ou nascer, e em qual
  módulo (o dono do dado).
- Quais comportamentos testar, do mais importante para o menos. Não dá para
  testar tudo, mas o caso de outra clínica entra sempre (seção "Inclua sempre o
  caso de outra clínica") e, se houver regra de papel, o de papel sem permissão.
- Por quais camadas a fatia passa (migration → Model → Repository → Service →
  Controller + Policy → rota → `infrastructure/` → `application/` → página).
- Tela com layout de referência (print, Figma)? Olhe antes de planejar.

Só comece depois que o usuário aprovar.

### 2. Primeiro teste

Escreva **um** teste para o primeiro comportamento e rode:
`php artisan test --filter=NomeDoTest` (ou `npx vitest run <arquivo>`). Ele tem
que ficar **vermelho**, pelo motivo certo. Confira quantos testes rodaram: zero
não é vermelho nem verde, é filtro errado.

Escreva o mínimo de código para ele ficar **verde**.

### 3. Um comportamento por vez

Para cada comportamento seguinte: teste vermelho, código mínimo, verde. Rode os
testes do módulo (`vendor/bin/phpunit modules/<Modulo>/tests`) antes de passar
ao próximo. Sem código para um teste que ainda não existe.

### 4. Refatore, só no verde

- Controller fino, regra no Service, acesso a banco no Repository, DTO
  `readonly`, dependência por interface.
- Confira as regras do fisioweb: `clinic_id` em toda query, Policy com posse,
  rota no guard certo, sem import de Model/Repository de outro módulo, loader
  chamando `application/`, só `apiClient`, `domain/` puro, RHF + Zod.
- Consulta dentro de laço vira uma consulta só (`with()`).
- Rode os testes depois de cada passo.

### 5. Prove que os testes testam

Para cada teste novo, estrague de propósito o código que ele protege (tire o
filtro por `clinic_id`, faça a Policy devolver `true`), veja o teste ficar
vermelho e desfaça.

### 6. Definição de Pronto

Passe por cada item de `docs/ai-harness/DEFINITION_OF_DONE.md`:

1. `bash bin/verificar.sh` sem FALHOU nem NÃO VERIFICADO.
2. Smoke test com evidência em `.ai-workbench/<feature>/evidence/<tarefa>/`,
   ou o motivo para pular.
3. Skill `revisao-adversaria` até APROVADO.
4. O que ficou fora vai para `.ai-workbench/<feature>/DEFERRED.md`.
5. Só agora marque `[x]` nos critérios de aceite da tarefa e o status
   `concluída` no `README.md` da feature.

### 7. Relate

O que foi feito, o que foi provado e com qual comando, o resultado da revisão e o
que ficou de fora ou sem conferir.

**Não faça `git add` nem commit.** Liste os arquivos alterados e sugira uma
mensagem de commit no estilo do repositório: curta e em português
("corrige ...", "implementa ...", "ajusta ...").
