# Decisões — área paciente DS v2 (contexto para as 3 telas restantes)

| ID | Decisão |
|----|---------|
| D1 | Marca na área paciente: **IVS Fisioterapia e Saúde** (igual clínica), não “Fisioweb”. |
| D2 | Navbar paciente v2: **`DsPatientNavbar`** + badge **`showPrototypeBadge`** enquanto a migração da área não fechar. |
| D3 | Container scroll: `h-full w-full flex flex-col overflow-y-auto bg-ds-surface-body font-ds`. |
| D4 | Vídeos de exercício na jornada: **aspecto quadrado 1:1** (Instagram), alinhado detalhe programa + execução. |
| D5 | Protótipos: usuário escolhe A/B/C → consolidar na page → apagar pasta `*-variants/`. Feedback **B**; execução **A**; login **A**; detalhe programa **B**. **Lista de programas: C** (preview com `?variant=C`; rota normal permanece v1 até consolidar). |
| D6 | Tokens de sucesso: usar utilitários de `tokens.css` (`ds-status-success-*`, `ds-success-100`, etc.). |
| D7 | Escopo destas 3 telas: **só frontend**, sem API/migration/Policy. |
