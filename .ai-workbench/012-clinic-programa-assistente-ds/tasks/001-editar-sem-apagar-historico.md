# Editar programa sincroniza exercícios e grupos por id, sem apagar o histórico do paciente

**Tipo:** Bug
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 17, 18
**Issue:** ainda não criada

## Descrição

Hoje, salvar a edição de um programa apaga todos os grupos e exercícios e cria
de novo. As séries que o paciente registrou apontam para o exercício do
programa com `cascadeOnDelete`, então somem junto: ajustar uma repetição zera o
histórico do paciente.

A abordagem é a do ADR 021 (modelo de evolução). O `PUT` passa a aceitar o `id`
de grupo e de exercício que já existem. Com `id`, atualiza no lugar; sem `id`,
cria; o que existia e não veio é apagado. Diferença consciente em relação ao
ADR 021: o que sai é apagado, não arquivado (decisão do usuário).

## O que construir

- **Dono:** módulo `TreatmentProgram`, sem migration. Rota `PUT /api/clinic/treatment-plans/{id}`, guard `clinic`, todos os papéis da clínica (Policy não muda).
- **Grupos:** cada grupo aceita `id` opcional. Com `id`, atualiza nome e ordem; sem `id`, cria; os que não vieram são apagados.
- **Exercícios:** cada exercício aceita `id` opcional. Com `id`, atualiza grupo, ordem, dose, dias, período e notas no lugar, mantendo as séries registradas; sem `id`, cria (com os padrões do catálogo, como hoje); os que não vieram são apagados, levando só as séries deles.
- **`id` alheio:** `id` de grupo ou exercício que não pertence a este programa (mesmo que seja de outro programa da mesma clínica) responde 422 e não muda nada.
- **Compatível com a v1:** um payload sem nenhum `id` continua funcionando e se comporta como hoje (tudo é criado, o antigo é apagado).
- **Isolamento:** a busca do plano continua filtrada por `clinic_id` no repositório; programa de outra clínica responde 404.
- **ADR 025** em `docs/adr/`: editar programa não apaga o histórico do paciente (sincronizar por id; o que sai é apagado). A tarefa 002 completa o mesmo ADR com o link novo ao trocar de paciente.

## Critérios de Aceite

- [ ] Editar a dose de um exercício com séries registradas mantém o mesmo `id` e as séries (PHPUnit).
- [ ] Mudar a ordem ou o grupo de um exercício mantém o `id` e as séries (PHPUnit).
- [ ] Tirar um exercício apaga só as séries dele; as dos outros ficam (PHPUnit).
- [ ] Renomear e reordenar grupos mantém os `id`s dos grupos (PHPUnit).
- [ ] `id` de grupo ou exercício de outro programa responde 422 e nada muda no banco (PHPUnit).
- [ ] Payload sem `id` continua aceito (a v1 de edição segue funcionando até a tarefa 006).
- [ ] O `PUT` no programa de outra clínica continua 404, sem revelar nada (`TreatmentPlanIsolationTest` verde).
- [ ] ADR 025 escrito.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** a definir com o usuário antes de começar (a feature 011 está em `feat/clinic-historico-exercicios-programas`, sem push).
- **Exemplo no código:** `docs/adr/021-editar-modelo-de-evolucao-nao-apaga-historico.md` (a regra de sincronizar por id); `modules/TreatmentProgram/tests/Feature/TreatmentPlanIsolationTest.php` e `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramExecutionTest.php` (montar plano com séries registradas).
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-testing`, `domain-modeling` (ADR).

## Como testar na mão

1. Com a clínica de exemplo, abra o programa 7 como paciente pelo link e registre séries de um exercício.
2. Pela API (ou pela v1 depois de mandar os `id`s), faça um `PUT` no programa 7 mudando só as repetições desse exercício, com o `id` dele.
3. Abra o link de novo: a última carga e as séries registradas continuam lá.
4. Faça um `PUT` sem esse exercício: só as séries dele somem.
5. Mande no `PUT` o `id` de um exercício de outro programa: 422.
