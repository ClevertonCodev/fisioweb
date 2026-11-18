# Fechar a leitura pública do bucket `ivsdev`

O código da feature 019 não gera mais endereço no `cdn-dev.ivsmed.com` (ADR 030).
O bucket continua público por esse domínio próprio até alguém tirar o domínio no
painel. O R2 ignora o `visibility` do disco Laravel. Este roteiro é manual.

Enquanto o domínio existir, um caminho conhecido de vídeo, capa ou foto ainda
abre sem login. A regra de WAF do ADR 027 só cobre comprovante e arquivo do
prontuário, e perde o objeto quando o domínio sair.

## 1. Tirar o domínio próprio

1. Cloudflare → R2 → bucket `ivsdev` → Settings → Custom Domains.
2. Remover `cdn-dev.ivsmed.com`.
3. Public Development URL (`r2.dev`): conferir que continua **desligado**. O
   registro de 2026-11-16 no ADR 027 diz que esse bucket nunca teve essa URL.

## 2. CORS para o link assinado

O player baixa o vídeo com `GET` no endpoint S3
(`*.r2.cloudflarestorage.com`), a partir do browser. Sem `GET` no CORS, o
`blob:` falha.

R2 → bucket `ivsdev` → Settings → CORS. Uma regra, método `GET` (e `HEAD`):

- `https://app.ivsmed.com`
- `http://localhost:8000`
- `http://127.0.0.1:8000`
- cada origem de worktree que for tocar vídeo no browser. A porta não é fixa:
  o `fisio-app` anota em `AMBIENTE.md` da pasta (`http://localhost:<porta>`).
  Sem essa origem, o vídeo da worktree não baixa.

`AllowedHeaders`: `*`. `ExposeHeaders`: `Content-Length`, `Content-Type`,
`Accept-Ranges`, `ETag`.

Não colocar `Authorization` nos headers exigidos. O link assinado quebra se o
browser mandar o JWT junto; o `storageClient` existe para não mandar.

## 3. Prova

Troque `<caminho>` por um objeto que existe no bucket (um `path` de
`media_videos`). Antes de tirar o domínio, a primeira linha tende a dar 200
(vídeo e foto não passam pela regra de WAF). Depois, as duas deixam de dar 200.

O `r2.dev` não tem um endereço que dê para adivinhar: se o painel mostrar uma
Public Development URL ligada, troque `<id>` pelo que aparece lá (`pub-<id>.r2.dev`).
Se ela estiver desligada, a segunda linha não tem o que testar e pode ser pulada.

```bash
CAMINHO="<caminho>"
curl -sI -o /dev/null -w 'cdn %{http_code}\n' "https://cdn-dev.ivsmed.com/${CAMINHO}"
curl -sI -o /dev/null -w 'r2dev %{http_code}\n' "https://pub-<id>.r2.dev/${CAMINHO}"
```

O esperado depois do passo 1: as duas linhas diferentes de 200 (404 ou erro de
resolução de nome). Anote a data, quem fez e os dois códigos no fim deste
arquivo.

O link assinado da API continua abrindo: entre na clínica, abra um vídeo e
confira que o player toca. Esse endereço é o endpoint S3, com `X-Amz-Signature`,
e vence em 30 minutos.
