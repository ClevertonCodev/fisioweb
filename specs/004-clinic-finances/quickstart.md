# Quickstart: Clinic Finances

**Feature**: 004-clinic-finances
**Date**: 2026-06-20

Guia de validação end-to-end para a página **Finanças** da clínica. Não é guia de implementação (essa parte vive em `tasks.md` após `/speckit-tasks`). Os comandos abaixo são o caminho mais curto para exercitar cada user story do [spec.md](./spec.md).

Detalhes de modelo de dados estão em [data-model.md](./data-model.md) e contratos REST em [contracts/finances-api.md](./contracts/finances-api.md).

## 1. Pré-requisitos

- Stack já instalada: `composer install && npm install` no projeto.
- `.env` configurado com banco e JWT (mesmo do plano 003).
- **Nova dependência composer** declarada no plano (a ser instalada na fase de tarefas):

```bash
composer require openspout/openspout:^4
```

- Nenhuma dependência npm nova (Chart.js + react-chartjs-2 já presentes).

## 2. Subir o ambiente

```bash
composer run dev   # sobe Laravel + queue + Pail + Vite (todos concorrentes)
```

Em outro terminal, recriar o banco e popular o seed global de categorias (e dados demo se houver):

```bash
php artisan migrate:fresh --seed
php artisan db:seed --class="Modules\\Clinic\\Database\\Seeders\\FinancialCategorySeeder"
```

## 3. Autenticar como administrador da clínica

Login pela UI em `http://localhost:8000/clinica/login` com um usuário de papel **administrador** (a feature exige admin — FR-037). Para um usuário não-admin, o item de menu Finanças não aparece e qualquer chamada direta retorna 403 (validar SC-004 / FR-037).

## 4. Validar User Story 1 — Registrar e acompanhar transações (P1)

1. Abrir `http://localhost:8000/clinica/financas` (mês corrente selecionado por padrão).
2. Esperado: cards Entradas/Saídas/Saldo zerados, lista vazia com mensagem "Nenhuma transação nesse período".
3. Clicar em **Adicionar** → preencher data de hoje, descrição "Atendimento - João Silva", categoria "Atendimento", tipo entrada, valor 150,00, status "Recebido", método "Pix". Salvar.
4. Esperado: a transação aparece na lista; card "Entradas / Recebido" sobe para R$ 150,00; "Saldo geral / Disponível" passa a R$ 150,00.
5. Editar a transação para status "Pendente". Esperado: valor migra para "Pendente" sem alterar o total geral.
6. Excluir a transação (soft delete). Esperado: some da lista e dos cards. Aparece na rota `/clinica/financas/lixeira` (US complementar).
7. Em `/clinica/financas/lixeira`, clicar **Restaurar**. Esperado: volta para a lista e cards do mês.

## 5. Validar User Story 2 — Filtros, busca e ocultar valores (P2)

1. Criar 4–5 transações variadas (mix entrada/saída, status e categorias).
2. Aplicar filtro **Saídas › Saídas pendentes** no painel lateral. Esperado: lista e cards refletem apenas saídas com status `pendente`.
3. Digitar "João" no campo de busca. Esperado: lista filtra em tempo real (≤ 300 ms — SC-006).
4. Clicar **Limpar filtros**. Esperado: lista volta ao completo do mês.
5. Clicar no ícone de **olho** ("Ocultar valores"). Esperado: todos os valores na tela viram "•••" e o ícone alterna. Recarregar a página; o estado deve permanecer (preferência salva em `localStorage`).

## 6. Validar User Story 3 — Painel Relatório (P2)

1. Garantir transações em ao menos 2 meses (criar algumas no mês anterior via DevTools/`tinker` ajustando a `date` ou pela UI navegando ao mês anterior).
2. Abrir aba **Relatório**.
3. Conferir:
   - Cards Total de Entradas (verde), Total de Saídas (vermelho), Saldo e Variação % (vs mês anterior) com indicador ↑/↓.
   - Gráfico de linha Entradas × Saídas com tooltip ao passar o mouse.
   - Gráfico de pizza top 5 categorias com legenda interativa.
   - Gráfico de barras 12 meses com tooltip detalhado.
   - Tabela resumo com Categoria/Quantidade/Valor/Percentual, ordenável e filtrável por tipo.
4. Trocar o seletor de período para um intervalo personalizado. Esperado: cards e gráficos se atualizam coerentemente.
5. Exportar gráfico em **PNG** (botão no canto do chart). Arquivo `.png` baixado.

## 7. Validar User Story 4 — Exportar transações (P3)

1. Menu de opções → **Exportar transações**.
2. Escolher **Este mês** + formato **CSV**. Esperado: arquivo `financas-YYYY-MM-DD.csv` com colunas Data/Descrição/Categoria/Tipo/Método/Valor bruto/Taxa/Valor líquido/Status, contendo todas as transações do mês.
3. Repetir para **XLSX** e **PDF**.
4. Selecionar **Intervalo personalizado** com data final < data inicial. Esperado: botão Exportar desabilitado + mensagem de inconsistência (FR-026).
5. Selecionar intervalo sem transações. Esperado: 422 com mensagem amigável; o modal exibe o erro e mantém o usuário no diálogo.

## 8. Validar User Story 5 — Configurações financeiras (P3)

1. Menu de opções → **Configurações**.
2. Conferir seção "Configurar repasses e pagamentos" com aviso "Funcionalidade disponível apenas para equipes" e botão CTA **Quero expandir minha equipe** (clínica sem plano de equipe).
3. Acessar **Gerenciar categorias** → `/clinica/financas/categorias`.
4. Criar uma categoria custom "Pilates" tipo entrada. Esperado: aparece no select do form de transação.
5. Desativar uma categoria seed (ex.: "Consultoria"). Esperado: some do select do form, mas transações antigas continuam exibindo o nome da categoria normalmente.

## 9. Validar saldo inicial editável

1. Em `/clinica/financas`, clicar no ícone de lápis ao lado de "Saldo geral / Disponível".
2. Informar R$ 1.000,00 como saldo inicial do mês. Salvar.
3. Esperado: cards recalculam `Disponível = 1000 + recebidas − pagas` e `Previsto = Disponível + pendentes_entrada − pendentes_saida`.
4. Navegar ao mês anterior e voltar. O saldo inicial é por período (independente entre meses).

## 10. Validar autorização (admin-only)

1. Logar com usuário **não-admin** da mesma clínica.
2. Esperado: item de menu **Finanças** ausente.
3. Acessar manualmente `http://localhost:8000/clinica/financas` ou disparar `GET /clinic/finances/transactions` via REST. Esperado: 403 ou redirect para dashboard, com mensagem "Acesso restrito ao administrador da clínica."

## 11. Rodar a suíte de testes

```bash
composer run test           # backend (PHPUnit) — inclui pastas modules/Clinic/tests/Feature/Finances e Unit/Finances
npm run test                # frontend (Vitest) — inclui resources/js/test/finances
```

Esperado: tudo verde. Cobertura mínima esperada (qualitativa): contratos REST, autorização admin-only, multi-tenant (clínica A não vê dados da B), summary com saldo inicial, soft delete + restore, repository do front e schema Zod do form.

## 12. Smoke check de performance (SC-002 e SC-005)

Seed `php artisan db:seed --class=...FinancialDemoSeeder` (a ser criado em tasks) com ~5.000 transações no mês corrente e 10.000 nos últimos 12 meses; medir:

- Tempo de resposta de `GET /clinic/finances/transactions?period=YYYY-MM` (esperado ≤ 1 s).
- Tempo de resposta dos endpoints `reports/*` (esperado ≤ 2 s acumulado para abrir a aba Relatório).
- Filtros/busca refletindo em ≤ 300 ms.
