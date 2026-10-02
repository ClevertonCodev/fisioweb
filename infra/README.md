# Deploy do fisioweb

Como colocar e manter o fisioweb no ar: um servidor Ubuntu com tudo junto,
atrás da Cloudflare.

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
| `infra/provision.sh` | Prepara um Ubuntu limpo. Roda no servidor, como root. Pode rodar de novo sem medo: não reinstala nada nem sobrescreve o `.env`. |
| `deploy.php` | Publica o código com o [Deployer 7](https://deployer.org). Roda na máquina de quem faz o deploy. |

Domínio atual: **https://fisio.clevertonsantos.com** (variável `DOMAIN` no
topo do `provision.sh`).

---

## O que você precisa ter

| O quê | Para quê |
| --- | --- |
| Chave SSH cadastrada no **root** do servidor | Rodar o `provision.sh` |
| Chave SSH com acesso ao repositório **ClevertonCodev/fisioweb** no GitHub | O servidor clona o código usando a sua chave (ver abaixo) |
| Acesso à conta da **Cloudflare** do domínio | DNS e certificado |
| PHP 8.4+ e Composer na sua máquina | O Deployer vem pelo Composer (`vendor/bin/dep`) |
| Os valores secretos do `.env` (R2, Google) | Peça a quem já opera o projeto |

---

## Preparar a sua máquina (uma vez)

**1. Instalar o Deployer** (vem como dependência de desenvolvimento):

```bash
composer install
vendor/bin/dep --version      # Deployer 7.x
```

Use sempre `vendor/bin/dep`. Se você tiver um `dep` global de outro
projeto, ele pode ser o Deployer 6, que não entende este `deploy.php`.

**2. Deixar sua chave do GitHub disponível para o servidor.** O repositório é
privado. No deploy, o servidor pede emprestada a sua chave (agent
forwarding) para clonar o código. A chave nunca sai da sua máquina, mas
precisa estar carregada no `ssh-agent`:

```bash
ssh-add ~/.ssh/id_ed25519     # ou id_rsa: a chave que acessa o GitHub
ssh-add -l                    # tem que listar a chave
```

Para não precisar repetir depois de reiniciar, adicione no `~/.ssh/config`:

```
Host github.com
    AddKeysToAgent yes
    UseKeychain yes           # só no macOS; no Linux remova esta linha
    IdentityFile ~/.ssh/id_ed25519
```

---

## Instalar um servidor do zero

Os comandos abaixo usam a variável `IP`. Defina uma vez no terminal:

```bash
IP=203.0.113.10               # IP do servidor novo
```

### 1. Criar o servidor

Qualquer provedor serve (DigitalOcean, Hetzner…):

- **Sistema:** Ubuntu 24.04 LTS ou 26.04 LTS, limpo.
- **Tamanho:** 2 vCPU e **4 GB de RAM**. O `provision.sh` está ajustado para
  isso; com menos RAM, reduza o `pm.max_children` dele.
- **Acesso:** por chave SSH (cadastre a sua `.pub` na criação), sem senha.

Confira que entra **sem pedir senha**:

```bash
ssh root@$IP 'lsb_release -d && free -h'
```

### 2. Apontar o projeto para o servidor

No `deploy.php`, troque o IP em `->setHostname('...')`. Faça commit e push.

### 3. (Migração) Trazer `.env` e certificado do servidor antigo

Só se estiver trocando de servidor. Pule se é a primeira instalação. Os
arquivos precisam ir **antes** do `provision.sh`: se já estiverem no lugar,
o script usa eles (inclusive a senha do banco do `.env`) em vez de gerar
novos. Veja [Trocar de servidor](#trocar-de-servidor).

### 4. Provisionar

```bash
scp infra/provision.sh root@$IP:/root/
ssh root@$IP 'bash /root/provision.sh'
```

Leva de 5 a 10 minutos. Ele faz:

- **Segurança:** usuário `fisioweb` (dono da aplicação e de quem faz o
  deploy), com as mesmas chaves SSH do root. Desliga o login por senha.
  Firewall `ufw` só com 22, 80 e 443, mais `fail2ban` e atualizações
  automáticas.
- **Programas:** swap de 2 GB, nginx, PHP 8.5-FPM, Composer, Node 22 (só para
  o build), PostgreSQL e Valkey.
- **Aplicação:** gera o `.env` com `APP_KEY`, `JWT_SECRET` e a senha do banco,
  e cria o banco `fisioweb`.
- **Rotinas:** worker da fila (systemd), scheduler (cron) e backup diário do
  banco.

Se aparecer **"O upgrade pede reinício"**, rode `ssh root@$IP reboot`, espere
1 minuto e rode o script de novo.

Confira:

```bash
ssh root@$IP 'systemctl is-active nginx php8.5-fpm postgresql valkey-server fail2ban; ufw status'
ssh fisioweb@$IP whoami       # tem que responder: fisioweb
```

### 5. Certificado de origem da Cloudflare

Pule se trouxe o certificado no passo 3.

O script sobe o nginx com um certificado provisório (autoassinado). A
Cloudflare está configurada como *Strict* para este domínio (ver
[Cloudflare](#cloudflare)), então o site dá **erro 526** até instalar o
certificado de origem. Ele é grátis e vale 15 anos.

1. Cloudflare → **SSL/TLS → Origin Server → Create Certificate**: RSA 2048,
   hostname só `fisio.clevertonsantos.com`, 15 anos. Não feche a tela, porque
   a *Private Key* só aparece uma vez.
2. Salve os dois blocos em arquivos **fora do repositório**: *Origin
   Certificate* em `origin.pem` e *Private Key* em `origin.key`.
3. Envie e recarregue o nginx:
   ```bash
   scp origin.pem root@$IP:/etc/ssl/fisioweb/origin.pem
   scp origin.key root@$IP:/etc/ssl/fisioweb/origin.key
   ssh root@$IP 'chmod 600 /etc/ssl/fisioweb/origin.key && nginx -t && systemctl reload nginx'
   ```
4. Apague os arquivos locais, ou guarde num cofre de senhas.

### 6. Completar o `.env`

Pule se trouxe o `.env` no passo 3.

O script já preencheu o que é do servidor (chaves, banco, cache, fila). Falta
o que vem de serviços externos:

| Grupo | Variáveis | Sem isso… |
| --- | --- | --- |
| Cloudflare R2 | `CLOUDFLARE_*` (conta, chaves, bucket, endpoint, CDN) | upload de vídeo e imagem não funciona |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | integração com Google Calendar não conecta |
| WhatsApp | `VITE_SUPPORT_WHATSAPP` | botão de suporte sem número |
| E-mail | `MAIL_*` | com `MAIL_MAILER=log`, e-mails só vão para o log |

```bash
ssh -t fisioweb@$IP nano /var/www/fisioweb/shared/.env
```

### 7. Apontar o DNS

Cloudflare → **DNS → Records**: registro `A`, nome `fisio`, conteúdo `$IP`,
proxy **ligado** (nuvem laranja). Se o registro já existe, só troque o IP.

```bash
curl -sI https://fisio.clevertonsantos.com | head -1
```

Antes do primeiro deploy o esperado é `HTTP/2 404`. Um **526** quer dizer
que o certificado do passo 5 está faltando ou errado.

### 8. Primeiro deploy

```bash
vendor/bin/dep deploy production
```

Depois, **um** destes:

```bash
vendor/bin/dep artisan:db:seed production    # banco novo com dados de demonstração
```

ou restaure um dump (ver [Backup](#backup)).

Confira: `https://fisio.clevertonsantos.com/up` deve responder **200**.

> Os seeders (`database/seeders/DatabaseSeeder.php`) criam usuários de
> demonstração com senha `12345678`. Troque antes de dar acesso a alguém de
> fora.

---

## Trocar de servidor

Do servidor **antigo**, copie para uma pasta fora do repositório (são
segredos: nunca no git nem no chat):

```bash
ANTIGO=198.51.100.20
mkdir -p ~/fisioweb-servidor && chmod 700 ~/fisioweb-servidor
scp root@$ANTIGO:/var/www/fisioweb/shared/.env  ~/fisioweb-servidor/.env
scp root@$ANTIGO:/etc/ssl/fisioweb/origin.pem   ~/fisioweb-servidor/
scp root@$ANTIGO:/etc/ssl/fisioweb/origin.key   ~/fisioweb-servidor/

# opcional: dados do banco
ssh root@$ANTIGO fisioweb-backup
scp "root@$ANTIGO:/var/backups/fisioweb/*.dump" ~/fisioweb-servidor/
```

No servidor **novo**, depois do passo 2 e **antes** do passo 4:

```bash
ssh root@$IP 'mkdir -p /var/www/fisioweb/shared && install -d -m 700 /etc/ssl/fisioweb'
scp ~/fisioweb-servidor/.env        root@$IP:/var/www/fisioweb/shared/.env
scp ~/fisioweb-servidor/origin.pem  root@$IP:/etc/ssl/fisioweb/origin.pem
scp ~/fisioweb-servidor/origin.key  root@$IP:/etc/ssl/fisioweb/origin.key
ssh root@$IP 'chmod 600 /var/www/fisioweb/shared/.env /etc/ssl/fisioweb/origin.key'
```

Siga a instalação normalmente, pulando os passos 5 e 6. No passo 8, restaure
o dump em vez de rodar os seeders. Só desligue o servidor antigo depois que o
novo responder no domínio.

---

## Cloudflare

O que está configurado e por quê:

| Onde | Configuração |
| --- | --- |
| **DNS** | `A` `fisio` → IP do servidor, proxy ligado |
| **Rules → Configuration Rules** | Regra "fisio full strict": `Hostname equals fisio.clevertonsantos.com` → SSL **Strict** |
| **SSL/TLS → Origin Server** | Certificado de origem instalado em `/etc/ssl/fisioweb/` |
| **SSL/TLS → Overview** | Fica como está (*Full*/automático). **Não mude**: vale para o domínio inteiro e pode derrubar outros sites que usam o mesmo domínio |

A regra existe para exigir o certificado válido (*Strict*) só no fisioweb,
sem afetar o resto do domínio. Tudo isso é do plano Free.

O nginx também recebe o IP real do visitante pelo cabeçalho
`CF-Connecting-IP` (lista de IPs da Cloudflare gerada pelo `provision.sh`).

---

## Dia a dia

```bash
vendor/bin/dep deploy production                  # publica a main
vendor/bin/dep deploy production --branch=outra   # publica outra branch
vendor/bin/dep rollback production                # volta para a release anterior
vendor/bin/dep ssh production                     # shell na release atual
```

Cada deploy cria uma pasta nova em `/var/www/fisioweb/releases/`, instala as
dependências, faz o build do front, roda as migrations e só então troca o
link `current`. O site não sai do ar, e as últimas 5 releases ficam
guardadas para rollback. No fim, recarrega o PHP-FPM e reinicia o worker da
fila.

Mudou alguma `VITE_*` no `.env`? Precisa de um deploy, porque elas entram no
build do front. Mudou outra variável? Também faça um deploy, para refazer o
`config:cache`.

### Onde fica cada coisa no servidor

| Caminho | O quê |
| --- | --- |
| `/var/www/fisioweb/current` | Release ativa (link para `releases/N`) |
| `/var/www/fisioweb/shared/.env` | Configuração (só o usuário `fisioweb` lê) |
| `/var/www/fisioweb/shared/storage/logs/` | Logs do Laravel |
| `/etc/ssl/fisioweb/` | Certificado de origem da Cloudflare |
| `/var/backups/fisioweb/` | Dumps diários do banco |

### Logs e comandos

```bash
# log do Laravel
ssh fisioweb@$IP 'tail -f /var/www/fisioweb/shared/storage/logs/laravel-*.log'

# artisan
ssh fisioweb@$IP 'cd /var/www/fisioweb/current && php artisan migrate:status'

# worker da fila e nginx
ssh root@$IP 'journalctl -u fisioweb-queue -f'
ssh root@$IP 'tail -f /var/log/nginx/error.log'
```

### Backup

Todo dia às 03:30 vai um dump para `/var/backups/fisioweb/` (guarda 7
dias). Como root:

```bash
fisioweb-backup                                                    # gera um agora
sudo -u postgres pg_restore --clean --if-exists --no-owner --role=fisioweb \
    -d fisioweb /var/backups/fisioweb/ARQUIVO.dump                 # restaura
```

O backup fica no **mesmo disco** do servidor. Quando houver dados de
verdade, ligue o backup do provedor (DigitalOcean/Hetzner cobram ~20% a mais)
ou envie os dumps para o R2.

---

## Pendências

- [ ] **Google Cloud Console:** cadastrar a URL de retorno
      `https://fisio.clevertonsantos.com/api/clinic/google-calendar/callback`.
- [ ] **R2 → Settings → CORS Policy:** liberar `https://fisio.clevertonsantos.com`
      para `PUT` e `GET`. Sem isso o upload de vídeo pelo navegador falha.
- [ ] **Bucket próprio:** hoje o servidor usa o mesmo bucket R2 do
      desenvolvimento local.
- [ ] **Backup fora da máquina** (ver [Backup](#backup)).

---

## Problemas conhecidos

| Sintoma | Causa | Solução |
| --- | --- | --- |
| `Failed to connect to system scope bus` durante o `provision.sh` | O `apt upgrade` atualizou systemd/kernel e o sistema precisa reiniciar | `reboot` e rodar o script de novo (ele já detecta e avisa) |
| `ssh fisioweb@IP` → `Permission denied (publickey)` | O `provision.sh` não rodou, ou a sua chave não estava no root quando ele rodou | Confira `ssh root@IP` sem senha e rode o script de novo |
| Deploy falha no `deploy:update_code` com `Permission denied (publickey)` | Sua chave do GitHub não está no `ssh-agent` | `ssh-add ~/.ssh/SUA_CHAVE` e deploy de novo |
| `Failed opening required 'contrib/npm.php'` | Rodou o Deployer 6 | Use `vendor/bin/dep` |
| Site com erro **526** | Certificado de origem ausente ou errado | [Passo 5](#5-certificado-de-origem-da-cloudflare) |
| `view:cache` → `.../resources/views directory does not exist` | Módulo registrando views sem ter a pasta | Módulo sem views não deve chamar `registerViews()` no ServiceProvider |
