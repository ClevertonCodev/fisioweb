# Deploy do fisioweb

Um servidor Ubuntu com tudo junto, atrás da Cloudflare:

```
navegador ──HTTPS──▶ Cloudflare ──HTTPS──▶ nginx ─▶ PHP-FPM 8.5 ─▶ PostgreSQL
                                                         │          Valkey (cache/sessão/fila)
                                                         └─▶ worker da fila (systemd)
                                                             scheduler (cron, 1/min)
                                                             backup do banco (cron, 03:30)
vídeos/imagens ──URL pré-assinada──▶ Cloudflare R2 (não passam pelo servidor)
```

| Arquivo | Para quê |
| --- | --- |
| `infra/provision.sh` | Prepara o servidor. Roda **uma vez** como root (pode repetir sem medo). |
| `deploy.php` | Publica o código com o [Deployer 7](https://deployer.org). Roda da sua máquina. |

> Este `deploy.php` é do Deployer 7 (fica em `vendor/bin/dep`). Se o seu
> `dep` global for o 6.x do paytour, rode `vendor/bin/dep` ou faça o `dep`
> global preferir o `./vendor/bin/dep` quando ele existir.

---

## Primeira instalação

### 1. Sua chave SSH no servidor

Se você ainda entra como root por senha:

```bash
ssh-copy-id root@159.69.100.198
```

O `provision.sh` copia essa chave para o usuário `fisioweb` e **desliga o
login por senha**. Confira que `ssh root@159.69.100.198` entra sem pedir
senha antes de continuar.

### 2. DNS na Cloudflare

- **DNS → Add record**: tipo `A`, nome `fisio`, conteúdo `159.69.100.198`,
  proxy **ligado** (nuvem laranja).
- **SSL/TLS → Overview**: modo **Full** (por enquanto).

### 3. Provisionar

```bash
scp infra/provision.sh root@159.69.100.198:/root/
ssh root@159.69.100.198 'bash /root/provision.sh'
```

Leva uns 5 minutos. No final ele mostra as versões instaladas.

### 4. Certificado de origem da Cloudflare

O script sobe o nginx com um certificado autoassinado. Troque pelo da
Cloudflare (grátis, vale 15 anos):

1. **SSL/TLS → Origin Server → Create Certificate**, hostname
   `fisio.clevertonsantos.com`.
2. No servidor, como root, cole o certificado e a chave:
   ```bash
   nano /etc/ssl/fisioweb/origin.pem   # "Origin Certificate"
   nano /etc/ssl/fisioweb/origin.key   # "Private Key"
   nginx -t && systemctl reload nginx
   ```
3. Volte em **SSL/TLS → Overview** e mude para **Full (strict)**.

### 5. Preencher o `.env`

O script já gerou `APP_KEY`, `JWT_SECRET` e a senha do banco. Falta o que
vem de fora:

```bash
ssh fisioweb@159.69.100.198 nano /var/www/fisioweb/shared/.env
```

- **Cloudflare R2**: `CLOUDFLARE_*` (conta, chaves, bucket, endpoint, CDN).
- **Google**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. No Google Cloud
  Console, cadastre a URL de retorno
  `https://fisio.clevertonsantos.com/api/clinic/google-calendar/callback`.
- **E-mail**: `MAIL_*` (enquanto for `log`, os e-mails vão só para o log).
- **WhatsApp de suporte**: `VITE_SUPPORT_WHATSAPP`.

No bucket do R2, em **Settings → CORS Policy**, libere a origem
`https://fisio.clevertonsantos.com` para `PUT` e `GET`. Sem isso o
upload de vídeo pelo navegador falha.

### 6. Primeiro deploy

Troque `159.69.100.198` no `deploy.php` pelo IP real. O servidor clona o
GitHub **usando a sua chave** (agent forwarding), então ela precisa estar
carregada:

```bash
ssh-add ~/.ssh/id_ed25519          # a chave que acessa o GitHub
dep deploy production
dep artisan:db:seed production
```

Abra `https://fisio.clevertonsantos.com/up`. Deve responder 200.

> Os seeders criam usuários de demonstração com senha `12345678`. Troque
> antes de dar acesso a alguém de fora.

---

## Dia a dia

```bash
dep deploy production                  # publica a main
dep deploy production --branch=outra   # publica outra branch
dep rollback production                # volta para a release anterior
dep ssh production                     # shell na release atual
```

Cada deploy cria uma pasta nova em `/var/www/fisioweb/releases/`, instala
dependências, faz o build do front, roda as migrations e só então troca o
link `current`. O site não sai do ar e as últimas 5 releases ficam
guardadas para rollback.

Mudou alguma `VITE_*` no `.env`? Precisa de um novo deploy (elas entram no
build). Mudou outra variável? Também faça um deploy, para refazer o
`config:cache`.

### Logs e comandos

```bash
# log do Laravel
ssh fisioweb@159.69.100.198 'tail -f /var/www/fisioweb/shared/storage/logs/laravel-*.log'

# artisan
ssh fisioweb@159.69.100.198 'cd /var/www/fisioweb/current && php artisan migrate:status'

# worker da fila e nginx (como root)
journalctl -u fisioweb-queue -f
tail -f /var/log/nginx/error.log
```

### Backup

Todo dia às 03:30 vai um dump para `/var/backups/fisioweb/` (guarda 7
dias). Para rodar na hora ou restaurar, como root:

```bash
fisioweb-backup
sudo -u postgres pg_restore --clean -d fisioweb /var/backups/fisioweb/ARQUIVO.dump
```

O backup fica no **mesmo disco** do servidor. Quando houver dados de
verdade, ligue o **Backups** do servidor no painel da Hetzner (cópia fora
da máquina, +20% no preço) ou mande os dumps para o R2.
