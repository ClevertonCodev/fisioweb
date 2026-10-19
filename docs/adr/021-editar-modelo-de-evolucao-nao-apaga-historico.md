# ADR: Editar um modelo de evolução não pode apagar o que foi marcado nas evoluções

## Contexto

Ao escrever uma evolução com um modelo, o fisioterapeuta toca nos itens do modelo (ex.: "Crioterapia", "Bicicleta — 15 minutos"). A evolução guarda duas coisas:

1. **O texto pronto** (`clinic_patient_evolutions.generated_text`), que é o que aparece no prontuário.
2. **O que foi marcado** (`clinic_patient_evolution_checked_items`): uma linha por item tocado, com o id do item do modelo (`evolution_template_item_id`) e o complemento digitado (`free_text_value`).

Como está hoje, a parte 2 se perde sem aviso:

- `EvolutionTemplateService::update` chama `EvolutionTemplateRepository::replaceSections` sempre que recebe `sections`. Esse método **apaga todas as seções e todos os itens do modelo e cria de novo**, com ids novos, mesmo que nada tenha mudado.
- A FK `clinic_patient_evolution_checked_items.evolution_template_item_id` é `cascadeOnDelete`. Quando os itens antigos são apagados, o banco **apaga junto as marcações de todas as evoluções feitas com aquele modelo**, inclusive as assinadas e as que estão na lixeira (`softDeletes` na evolução não protege a tabela filha).
- O interruptor "Ativo" da lista v1 (`EvolutionTemplateListPage`, `handleToggleActive`) busca o modelo e manda tudo de volta no `PUT`, seções incluídas. O service ignora `is_active` (grava só nome, descrição e seções). Assim, o clique não desativa nada e ainda dispara o apagamento acima.
- A exclusão já é protegida: `EvolutionTemplateService::destroy` recusa modelo com evoluções (`hasEvolutions`). A edição não tem proteção nenhuma.

O que se perde e o que não se perde:

- **Fica:** o `generated_text`, ou seja, o texto da evolução no prontuário.
- **Some:** quais itens foram marcados e os complementos. Uma evolução em rascunho reaberta vem sem nada marcado, e "Repetir a sessão" (nova evolução v2) não consegue remarcar os itens da anterior.

Quem é afetado: só os modelos da clínica (`is_system = false`) já usados em evoluções. O modelo do sistema não se edita (o controller responde 404 e o service recusa). No banco de exemplo nada se perdeu, porque as evoluções do seed não têm itens marcados.

## Decisão

1. **A edição sincroniza por id, não apaga e recria.**
   - O `PUT /api/clinic/evolution-templates/{id}` passa a aceitar `id` em cada seção e item que já existem.
   - Com `id`: atualiza no lugar (título, texto, ordem, complemento).
   - Sem `id`: cria.
   - O que existia e não veio no payload é **arquivado** (coluna `archived_at` em seções e itens), nunca apagado.
   - O `id` de seção ou item que não pertence ao modelo responde 422.
2. **Item arquivado sai do modelo, mas não do histórico.** A nova evolução só oferece itens não arquivados. Uma evolução antiga continua mostrando o item marcado, com o rótulo e o texto da época.
3. **O banco recusa apagar item usado.** A FK `evolution_template_item_id` passa de `cascadeOnDelete` para `restrictOnDelete`, assim um erro futuro falha alto em vez de apagar histórico em silêncio. A FK de `evolution_template_section_id` nos itens fica como está, porque seção e item são arquivados juntos, nunca apagados.
4. **Ativar e desativar tem rota própria:** `PATCH /api/clinic/evolution-templates/{id}/active` com `{ is_active }`, que grava só esse campo. Nenhuma tela manda as seções para trocar a situação. Modelo inativo some da escolha na nova evolução e continua na lista.
5. **Até a correção sair:** tirar da v1 o envio das seções no interruptor "Ativo" (ou esconder o interruptor). Não editar modelos da clínica que já foram usados.

## Consequências

- Benefícios:
  - O registro do que foi feito na sessão não depende mais de ninguém deixar o modelo quieto.
  - "Repetir a sessão" e reabrir rascunho funcionam mesmo depois de o modelo mudar.
  - O interruptor "Ativo" passa a funcionar.
- Custos:
  - Migração: `archived_at` em `clinic_evolution_template_sections` e `clinic_evolution_template_items`, e a troca da FK de `checked_items`.
  - O update do service vira uma sincronização (criar, atualizar, arquivar) com validação de posse dos ids.
  - O front da edição (v1 e v2) passa a mandar os ids.
- Regras que agentes devem preservar:
  - Nunca apagar item ou seção de modelo que tenha `checked_items`; arquivar.
  - Nada de `cascadeOnDelete` apontando de dado clínico do paciente para configuração da clínica.
  - Testes de feature:
    - editar um modelo usado numa evolução assinada mantém os `checked_items` dela;
    - remover um item no editor arquiva, e a nova evolução não o oferece;
    - mandar o `id` de item de outro modelo ou de outra clínica responde 422;
    - o `PATCH .../active` grava `is_active` e não toca nas seções;
    - o modelo do sistema e o de outra clínica respondem 404.

## Alternativas descartadas

- **Só trocar a FK para `restrictOnDelete`:** o "apaga e recria" passaria a falhar com erro de banco em todo modelo já usado. Para de perder dado, mas deixa a edição quebrada.
- **Copiar rótulo e texto do item para dentro de `checked_items`:** protege o histórico, mas o "Repetir a sessão" continua sem saber qual item atual corresponde ao antigo.
- **Versionar o modelo inteiro a cada edição:** resolve tudo, mas é mais pesado do que o problema pede; arquivar item por item basta.

## Relacionados

- [ADR 020](020-modelos-de-evolucao-v2-acesso-e-editor.md): telas v2 dos modelos de evolução. O editor v2 só é liberado depois desta correção.
- Os modelos de avaliação do admin têm o mesmo desenho: `clinic_assessment_answers.admin_assessment_field_id` e `clinic_assessment_answer_options` são `cascadeOnDelete`. Hoje não existe tela que edite esses modelos, então não há risco. Quando existir, ela segue esta mesma regra.
