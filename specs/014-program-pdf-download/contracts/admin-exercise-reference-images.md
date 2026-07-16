# Contract: Admin Exercise Reference Images

**Feature**: `014-program-pdf-download`  
**Module owner**: `Admin` (persistência `admin_exercise_media`)  
**UI entry**: Admin Vídeos novo/editar (+ sync para exercícios que usam o vídeo)  
**Guard**: `admin` (JWT)

## Purpose

Permitir anexar até **2 imagens de referência** usadas no PDF do programa.

## Persistence

- Canônico: `ExerciseMedia` (`type=image`, `sort_order` 0..1).
- Staging (opcional): `media_videos.metadata.reference_images` quando o vídeo ainda não tem exercícios ligados.

## Suggested endpoints

Preferir estender o fluxo de vídeo/exercício existente em vez de inventar CRUD paralelo. Opções aceitas no plano:

### A) Sync no exercício (canônico)

| Method | Path | Notes |
|--------|------|-------|
| PUT/PATCH | `/api/admin/exercises/{id}/reference-images` | Body: lista 0..2 de paths/cdn_urls já enviados via presigned R2; substitui o conjunto |

### B) Sync a partir do vídeo

| Method | Path | Notes |
|--------|------|-------|
| PUT | `/api/admin/videos/{id}/reference-images` | Salva em `metadata.reference_images` e propaga `ExerciseMedia` para todos os exercícios ligados a esse `video_id` |

Implementação deve escolher **uma** superfície HTTP clara e documentá-la no PR; ambas respeitam max 2 imagens.

## Upload

Reutilizar fluxo presigned já usado para thumbnails (`Media` / Cloudflare): request URL → upload cliente → confirm path → persist `cdn_url`.

## Validation

- Máx. 2 imagens
- MIME: jpeg/png/webp (alinhar Media)
- Substituir conjunto inteiro (idempotente)

## Response shape (exemplo)

```json
{
  "data": {
    "reference_images": [
      { "sort_order": 0, "cdn_url": "https://...", "file_path": "thumbnails/videos/..." },
      { "sort_order": 1, "cdn_url": "https://...", "file_path": "thumbnails/videos/..." }
    ]
  }
}
```

## Frontend

- `AdminVideoCreatePage` / `AdminVideoEditPage`: dois slots opcionais de imagem (além do thumbnail)
- Repository admin correspondente; sem `fetch` direto — só `apiClient`
- Form: RHF + Zod se o formulário já for RHF; se a página ainda for `useState` legado, novos campos seguem o padrão da página sem expandir dívida desnecessariamente (preferir RHF se tocar o form inteiro)
