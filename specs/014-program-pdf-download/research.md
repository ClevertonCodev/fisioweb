# Research: Download PDF do Programa de Tratamento

**Feature**: `014-program-pdf-download`  
**Date**: 2026-07-16

## R1. Onde vivem as imagens de referência (sem migration nova)

**Decision**: Continuar usando `admin_exercise_media` (`ExerciseMedia`, `type = image`, `sort_order` 0..1, `cdn_url`). Máximo 2 imagens por exercício. Sem migration nova.

**Rationale**: Tabela e model já existem; seeds já populam as 2 URLs R2; o blade do PDF já prioriza `ExerciseMedia` com fallback no thumbnail do vídeo. Alinha com a clarificação da spec.

**Alternatives considered**:
- Colunas novas em `media_videos` → rejeitado (migration nova).
- Só `video.metadata` → possível sem migration, mas duplicaria a fonte de verdade já usada no PDF/seeds.

## R2. UI admin “vídeos novo/editar” vs ownership no Exercise

**Decision**: Upload das 2 imagens nas telas `AdminVideoCreatePage` / `AdminVideoEditPage` (pedido da spec). Persistência canônica em `ExerciseMedia` dos exercícios que usam aquele vídeo. Se o vídeo ainda não estiver ligado a nenhum exercício, guardar temporariamente em `videos.metadata.reference_images` (JSON já existente) e sincronizar para `ExerciseMedia` quando o exercício fizer `sync` de vídeos.

**Rationale**: Spec pede UI em vídeos; schema dono das imagens de referência do PDF é o Exercise. `metadata` evita migration.

**Alternatives considered**:
- Só formulário de Exercise New/Edit → mais limpo arquiteturalmente, mas diverge do pedido de UI em `/admin/videos/novo`.
- Migration em `media_videos` → rejeitado pela clarificação.

## R3. Destino do QR Code (deep link) sem SPA paciente completa

**Decision**: O QR codifica URL absoluta do deep link planejado do programa na área do paciente:

`{APP_URL}/{clinic.slug}/paciente/programas/{treatmentPlanId}`

Nesta feature:
1. Gerar e embutir essa URL no PDF (sempre que houver paciente + slug da clínica).
2. Registrar rota SPA/paciente mínima (ou redirect autenticado) que resolve esse path: se o paciente estiver autenticado e o plano for dele, exibe/abre o programa; senão, redireciona para login paciente com `returnUrl`.
3. UI completa da área do paciente (player, check-in diário, etc.) **fora do escopo** — só o deep link + landing/redirect suficientes para SC-004.

**Rationale**: Clarificação exige deep link do programa; hoje não há `pages/patient` de programas. Inventar URL estável agora evita quebrar PDFs impressos depois.

**Alternatives considered**:
- QR só para login genérico → rejeitado (clarificação B).
- Magic link / token sem login → fora do escopo (assumptions da spec).
- Omitir QR até existir paciente SPA completo → falharia SC-004.

## R4. Cabeçalho do responsável (foto, credencial, contatos)

**Decision**:
- Responsável = `TreatmentPlan.clinicUser` (já “Criado por” na UI). Eager-load `clinicUser` no `downloadPdf`.
- Foto: `clinicUser.photo_url`; fallback iniciais.
- Nome: `clinicUser.name`.
- Credencial: exibir `clinicUser.document` como identificação profissional quando preenchido (não há coluna CREFITO dedicada; sem migration).
- E-mail: `clinicUser.email`.
- Telefone: `ClinicUser` não tem `phone` — usar `clinic.phone` como fallback de contato; se ambos vazios, omitir linha de telefone.

**Rationale**: Reusa dados existentes sem migration; cobre o layout Vedius com defaults honestos.

**Alternatives considered**:
- Adicionar `phone`/`crefito` em `clinic_users` via migration → rejeitado neste ciclo.
- Manter cabeçalho só da clínica (estado atual do blade) → não atende FR-003.

## R5. Biblioteca QR no PDF (DomPDF)

**Decision**: Gerar QR server-side como PNG (data URI ou arquivo temporário) e embutir no blade. Preferir pacote leve já compatível com PHP 8.2 (ex.: `chillerlan/php-qrcode` ou equivalente já avaliado no `composer` se houver). DomPDF com `isRemoteEnabled` já carrega imagens remotas das mídias.

**Rationale**: DomPDF não gera QR nativamente; PNG embutido é o padrão estável.

**Alternatives considered**:
- QR só no frontend → PDF é gerado no backend.
- API externa de QR → dependência de rede desnecessária.

## R6. Páginas de anotações (teto 3 meses)

**Decision**: Calcular meses civis entre `start_date` e `end_date` (inclusivo), ordenar, pegar no máximo os **3 primeiros**. Cada página lista só os dias do período que caem naquele mês (checkbox + `d DDD` em pt-BR + linha). Sem persistência das marcações.

**Rationale**: Clarificação Q5 corrigida (teto 3).

## R7. Grupo sem nome → “Novo Grupo”

**Decision**: No blade/PDF view-model, se `trim(group.name)` for vazio, exibir **Novo Grupo**. Não alterar dados no banco só por causa do PDF.

**Rationale**: Spec FR-006; UI de montagem já defaulta “Novo grupo” em alguns fluxos, mas strings vazias ainda podem existir.

## R8. Frontend download

**Decision**: Espelhar evolução: `ProgramsRepository.downloadPdf(id)` → `apiClient.get(/clinic/treatment-plans/{id}/pdf, { responseType: 'blob' })` + helper `downloadProgramPdf` / abrir blob. Habilitar itens de menu em `ProgramDetailPage` e `ProgramHistoryTab` (remover `disabled`). Qualquer status já visível.

**Rationale**: Endpoint já existe; botões só estão hard-disabled; padrão evolutions já validado.

## R9. Fronteiras de módulo

**Decision**:
| Capacidade | Módulo dono |
|------------|-------------|
| Geração PDF do plano + anotações + QR URL | `TreatmentProgram` (orquestra) + view app-level |
| DomPDF | `Pdf` via `PdfGeneratorInterface` (preferir interface como evolutions; migrar away de `PdfService` concreto se fácil) |
| `ExerciseMedia` + upload admin | `Admin` (+ R2 via `Media`/`Cloudflare` contratos existentes) |
| Foto/dados do responsável | `Clinic` (`ClinicUser`) — TreatmentProgram só eager-load / lê campos |
| Deep link paciente | rota frontend + auth `Patient`; TreatmentProgram só gera URL |

**Rationale**: Monólito modular — sem write em tabelas de outro módulo fora do dono.

## R10. Complexidade / o que NÃO fazer

**Decision**: Fora de escopo nesta feature: WhatsApp/e-mail do PDF; sync digital das anotações; CREFITO/phone novos no schema; player completo do paciente; migration nova.

---

## Resolved NEEDS CLARIFICATION

Nenhum restante do Technical Context — decisões acima fecham QR, mídia, cabeçalho e UI admin.
