#!/usr/bin/env bash
#
# Provisiona um Ubuntu (24.04+ / 26.04) limpo para rodar o fisioweb.
# Tudo no mesmo servidor: nginx + PHP-FPM + PostgreSQL + Valkey/Redis +
# worker de fila + scheduler + backup diário do banco.
#
# Uso (no servidor, como root):
#   scp infra/provision.sh root@IP:/root/
#   ssh root@IP 'bash /root/provision.sh'
#
# É idempotente: pode rodar de novo sem quebrar nada. O .env só é criado
# na primeira vez; depois disso ele nunca é sobrescrito.

set -euo pipefail

DOMAIN="${DOMAIN:-fisio.clevertonsantos.com}"
PHP_VERSION="${PHP_VERSION:-8.5}"
NODE_MAJOR="${NODE_MAJOR:-22}"
DEPLOY_USER="fisioweb"
APP_DIR="/var/www/fisioweb"
DB_NAME="fisioweb"
DB_USER="fisioweb"
SWAP_SIZE="2G"
TIMEZONE="America/Sao_Paulo"

export DEBIAN_FRONTEND=noninteractive
cd /tmp  # sudo -u postgres reclama se o diretório atual for /root

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!!  %s\033[0m\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
    echo "Rode como root." >&2
    exit 1
fi

# ---------------------------------------------------------------------------
log "Pacotes base, fuso horário e atualizações automáticas"
# ---------------------------------------------------------------------------
apt-get update -q
apt-get upgrade -yq

# Upgrade de kernel/systemd/dbus deixa o systemctl sem conexão até reiniciar.
if [[ -f /var/run/reboot-required ]] || ! systemctl list-units &>/dev/null; then
    warn "O upgrade pede reinício. Rode 'reboot', espere 1 minuto e execute este script de novo."
    exit 1
fi

apt-get install -yq \
    ca-certificates curl gnupg git unzip zip acl openssl \
    software-properties-common ufw fail2ban unattended-upgrades cron
timedatectl set-timezone "$TIMEZONE"
systemctl enable --now unattended-upgrades fail2ban cron

# ---------------------------------------------------------------------------
log "Swap de $SWAP_SIZE (a máquina tem só ~4 GB de RAM)"
# ---------------------------------------------------------------------------
if ! swapon --show | grep -q /swapfile; then
    fallocate -l "$SWAP_SIZE" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-fisioweb.conf
sysctl -q --system

# ---------------------------------------------------------------------------
log "Usuário $DEPLOY_USER (dono da aplicação e de quem faz o deploy)"
# ---------------------------------------------------------------------------
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
AUTH_KEYS="/home/$DEPLOY_USER/.ssh/authorized_keys"
touch "$AUTH_KEYS"
if [[ -s /root/.ssh/authorized_keys ]]; then
    # Reaproveita as chaves que já entram como root.
    sort -u /root/.ssh/authorized_keys "$AUTH_KEYS" -o "$AUTH_KEYS"
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"

# O servidor clona o repositório do GitHub durante o deploy.
KNOWN_HOSTS="/home/$DEPLOY_USER/.ssh/known_hosts"
if ! grep -q github.com "$KNOWN_HOSTS" 2>/dev/null; then
    ssh-keyscan -t ed25519,rsa github.com >> "$KNOWN_HOSTS" 2>/dev/null
    chown "$DEPLOY_USER:$DEPLOY_USER" "$KNOWN_HOSTS"
fi

# Ao entrar por SSH, cai direto na pasta da aplicação. O .bashrc do Ubuntu
# só roda em sessão interativa, então não afeta os comandos do deploy.
BASHRC="/home/$DEPLOY_USER/.bashrc"
if ! grep -q "cd $APP_DIR" "$BASHRC" 2>/dev/null; then
    printf '\n# Entra direto na pasta da aplicação\ncd %s 2>/dev/null\n' "$APP_DIR" >> "$BASHRC"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$BASHRC"
fi

# ---------------------------------------------------------------------------
log "SSH: sem senha, só chave"
# ---------------------------------------------------------------------------
if [[ -s "$AUTH_KEYS" ]]; then
    cat > /etc/ssh/sshd_config.d/10-fisioweb.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
    sshd -t
    systemctl try-reload-or-restart ssh
else
    warn "Nenhuma chave SSH em /root/.ssh/authorized_keys. Login por senha continua LIGADO."
    warn "Adicione sua chave pública em $AUTH_KEYS e rode o script de novo."
fi

# ---------------------------------------------------------------------------
log "Firewall (22, 80, 443)"
# ---------------------------------------------------------------------------
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---------------------------------------------------------------------------
log "PHP $PHP_VERSION"
# ---------------------------------------------------------------------------
if ! apt-cache show "php${PHP_VERSION}-fpm" &>/dev/null; then
    add-apt-repository -y ppa:ondrej/php
    apt-get update -q
fi
apt-get install -yq \
    "php${PHP_VERSION}-fpm" "php${PHP_VERSION}-cli" "php${PHP_VERSION}-pgsql" \
    "php${PHP_VERSION}-intl" "php${PHP_VERSION}-bcmath" "php${PHP_VERSION}-gd" \
    "php${PHP_VERSION}-zip" "php${PHP_VERSION}-mbstring" "php${PHP_VERSION}-xml" \
    "php${PHP_VERSION}-curl" "php${PHP_VERSION}-readline"
# No repositório oficial do Ubuntu a extensão redis se chama php-redis.
apt-get install -yq "php${PHP_VERSION}-redis" 2>/dev/null || apt-get install -yq php-redis

cat > "/etc/php/${PHP_VERSION}/fpm/conf.d/99-fisioweb.ini" <<'EOF'
opcache.enable = 1
opcache.memory_consumption = 128
opcache.max_accelerated_files = 20000
realpath_cache_size = 4096K
realpath_cache_ttl = 600
expose_php = Off
EOF

# Pool próprio rodando como o usuário da aplicação. O pool "www" padrão sai.
rm -f "/etc/php/${PHP_VERSION}/fpm/pool.d/www.conf"
cat > "/etc/php/${PHP_VERSION}/fpm/pool.d/fisioweb.conf" <<EOF
[fisioweb]
user = $DEPLOY_USER
group = $DEPLOY_USER
listen = /run/php/fisioweb.sock
listen.owner = www-data
listen.group = www-data

; ~4 GB de RAM dividida com Postgres e Valkey: 12 processos é o teto seguro.
pm = dynamic
pm.max_children = 12
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
pm.max_requests = 500

catch_workers_output = yes

; Vídeos vão direto para o R2 (URL pré-assinada), não passam pelo PHP.
; 100M é também o limite de upload do plano grátis da Cloudflare.
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 100M
php_admin_value[post_max_size] = 100M
php_admin_value[max_execution_time] = 120
EOF
systemctl enable "php${PHP_VERSION}-fpm"
systemctl restart "php${PHP_VERSION}-fpm"

# ---------------------------------------------------------------------------
log "Composer"
# ---------------------------------------------------------------------------
if ! command -v composer &>/dev/null; then
    EXPECTED="$(curl -fsSL https://composer.github.io/installer.sig)"
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    ACTUAL="$(php -r "echo hash_file('sha384', '/tmp/composer-setup.php');")"
    if [[ "$EXPECTED" != "$ACTUAL" ]]; then
        echo "Checksum do instalador do Composer não confere." >&2
        exit 1
    fi
    php /tmp/composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
    rm /tmp/composer-setup.php
fi

# ---------------------------------------------------------------------------
log "Node.js $NODE_MAJOR (só para o npm run build no deploy)"
# ---------------------------------------------------------------------------
if ! node --version 2>/dev/null | grep -q "^v${NODE_MAJOR}\."; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
    apt-get install -yq nodejs
fi

# ---------------------------------------------------------------------------
log "PostgreSQL"
# ---------------------------------------------------------------------------
apt-get install -yq postgresql
PG_CONF_DIR="$(ls -d /etc/postgresql/*/main | sort -V | tail -1)"
cat > "$PG_CONF_DIR/conf.d/fisioweb.conf" <<'EOF'
# Ajustado para ~4 GB de RAM compartilhada com PHP e Valkey.
listen_addresses = 'localhost'
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 8MB
maintenance_work_mem = 128MB
EOF
systemctl enable postgresql
systemctl restart postgresql

# ---------------------------------------------------------------------------
log "Valkey (cache, sessão e fila)"
# ---------------------------------------------------------------------------
if apt-cache show valkey-server &>/dev/null; then
    apt-get install -yq valkey-server
    KV_SERVICE="valkey-server"
    KV_CONF="/etc/valkey/valkey.conf"
else
    apt-get install -yq redis-server
    KV_SERVICE="redis-server"
    KV_CONF="/etc/redis/redis.conf"
fi
sed -i -E 's/^bind .*/bind 127.0.0.1 -::1/' "$KV_CONF"
sed -i -E '/^#?\s*maxmemory /d; /^#?\s*maxmemory-policy /d' "$KV_CONF"
# volatile-lru: só descarta chaves com TTL (cache). Jobs da fila não têm
# TTL, então nunca são descartados quando a memória enche.
printf 'maxmemory 256mb\nmaxmemory-policy volatile-lru\n' >> "$KV_CONF"
systemctl enable "$KV_SERVICE"
systemctl restart "$KV_SERVICE"

# ---------------------------------------------------------------------------
log "Estrutura de pastas do Deployer + .env"
# ---------------------------------------------------------------------------
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/shared"
# A pasta pode ter sido criada pelo root (ao restaurar o .env de outro servidor).
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR" "$APP_DIR/shared"
ENV_FILE="$APP_DIR/shared/.env"

if [[ -f "$ENV_FILE" ]]; then
    DB_PASSWORD="$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)"
else
    DB_PASSWORD="$(openssl rand -hex 24)"
    APP_KEY="base64:$(openssl rand -base64 32)"
    JWT_SECRET="$(openssl rand -hex 32)"

    cat > "$ENV_FILE" <<EOF
APP_NAME=FisioWeb
APP_ENV=production
APP_KEY=$APP_KEY
APP_DEBUG=false
APP_URL=https://$DOMAIN

APP_LOCALE=pt_BR
APP_FALLBACK_LOCALE=pt_BR
APP_FAKER_LOCALE=pt_BR

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_DAILY_DAYS=14
LOG_LEVEL=debug

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASSWORD

SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

JWT_SECRET=$JWT_SECRET
SANCTUM_STATEFUL_DOMAINS=$DOMAIN

FILESYSTEM_DISK=local

# --- Preencher -------------------------------------------------------------
MAIL_MAILER=log
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS="nao-responda@$DOMAIN"
MAIL_FROM_NAME="\${APP_NAME}"

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_DISK=r2
CLOUDFLARE_CDN_URL=
CLOUDFLARE_CDN_ENABLED=true
CLOUDFLARE_CDN_CACHE_TTL=86400
CLOUDFLARE_VIDEO_DIRECTORY=videos
CLOUDFLARE_MAX_VIDEO_SIZE=524288000
CLOUDFLARE_GENERATE_THUMBNAILS=false
CLOUDFLARE_THUMBNAIL_DIRECTORY=thumbnails

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="\${APP_URL}/api/clinic/google-calendar/callback"
GOOGLE_PULL_INTERVAL_MINUTES=5
GOOGLE_FRONTEND_REDIRECT="/clinica/usuarios"

# Lidas no npm run build: mudou aqui, precisa de um novo deploy.
VITE_APP_NAME="\${APP_NAME}"
VITE_SUPPORT_WHATSAPP=
EOF
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Cria (ou alinha a senha de) o usuário e o banco com o que está no .env.
sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE ROLE $DB_USER LOGIN;
    END IF;
END
\$\$;
ALTER ROLE $DB_USER WITH PASSWORD '$DB_PASSWORD';
EOF
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
fi

# ---------------------------------------------------------------------------
log "nginx + HTTPS (Cloudflare)"
# ---------------------------------------------------------------------------
apt-get install -yq nginx
rm -f /etc/nginx/sites-enabled/default

# Certificado: o ideal é o "Origin Certificate" da Cloudflare (ver
# infra/README.md). Enquanto ele não existe, um autoassinado deixa o
# nginx subir e funciona com a Cloudflare no modo SSL "Full".
SSL_DIR="/etc/ssl/fisioweb"
install -d -m 700 "$SSL_DIR"
if [[ ! -f "$SSL_DIR/origin.pem" ]]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
        -keyout "$SSL_DIR/origin.key" -out "$SSL_DIR/origin.pem" \
        -subj "/CN=$DOMAIN" 2>/dev/null
    chmod 600 "$SSL_DIR/origin.key"
fi

# IP real do visitante (sem isto o Laravel só vê IPs da Cloudflare).
{
    echo "# Gerado por infra/provision.sh a partir de cloudflare.com/ips"
    for ip in $(curl -fsSL https://www.cloudflare.com/ips-v4) $(curl -fsSL https://www.cloudflare.com/ips-v6); do
        echo "set_real_ip_from $ip;"
    done
    echo "real_ip_header CF-Connecting-IP;"
} > /etc/nginx/snippets/cloudflare-realip.conf

cat > /etc/nginx/sites-available/fisioweb <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name $DOMAIN;

    ssl_certificate     $SSL_DIR/origin.pem;
    ssl_certificate_key $SSL_DIR/origin.key;

    include snippets/cloudflare-realip.conf;

    root $APP_DIR/current/public;
    index index.php;
    charset utf-8;
    client_max_body_size 100m;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location /build/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ ^/index\.php(/|\$) {
        fastcgi_pass unix:/run/php/fisioweb.sock;
        fastcgi_split_path_info ^(.+\.php)(/.*)\$;
        include fastcgi_params;
        # \$realpath_root resolve o symlink "current": cada release tem
        # seu próprio caminho, então o opcache nunca serve código velho.
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT \$realpath_root;
        fastcgi_read_timeout 120;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ \.php\$ { return 404; }
    location ~ /\.(?!well-known).* { deny all; }
}
EOF
ln -sf /etc/nginx/sites-available/fisioweb /etc/nginx/sites-enabled/fisioweb
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

# ---------------------------------------------------------------------------
log "Worker da fila (systemd) e scheduler (cron)"
# ---------------------------------------------------------------------------
cat > /etc/systemd/system/fisioweb-queue.service <<EOF
[Unit]
Description=fisioweb queue worker
After=network.target postgresql.service $KV_SERVICE.service
# Antes do primeiro deploy não existe "current"; o deploy liga o serviço.
ConditionPathExists=$APP_DIR/current/artisan

[Service]
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$APP_DIR/current
ExecStart=/usr/bin/php$PHP_VERSION $APP_DIR/current/artisan queue:work --tries=3 --max-time=3600 --sleep=3
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable fisioweb-queue

cat > /etc/cron.d/fisioweb <<EOF
# Scheduler do Laravel (sync do Google Calendar etc.)
* * * * * $DEPLOY_USER [ -f $APP_DIR/current/artisan ] && cd $APP_DIR/current && /usr/bin/php$PHP_VERSION artisan schedule:run >/dev/null 2>&1

# Backup diário do banco às 03:30
30 3 * * * root /usr/local/bin/fisioweb-backup >/var/log/fisioweb-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/fisioweb

# O deploy precisa reiniciar o PHP-FPM e o worker, e só isso.
cat > /etc/sudoers.d/fisioweb-deploy <<EOF
$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/systemctl reload php$PHP_VERSION-fpm, /usr/bin/systemctl restart fisioweb-queue
EOF
chmod 440 /etc/sudoers.d/fisioweb-deploy
visudo -cf /etc/sudoers.d/fisioweb-deploy

# ---------------------------------------------------------------------------
log "Backup diário do banco (local, guarda 7 dias)"
# ---------------------------------------------------------------------------
install -d -m 700 -o postgres -g postgres /var/backups/fisioweb
cat > /usr/local/bin/fisioweb-backup <<EOF
#!/usr/bin/env bash
set -euo pipefail
FILE="/var/backups/fisioweb/$DB_NAME-\$(date +%Y%m%d-%H%M).dump"
sudo -u postgres pg_dump -Fc "$DB_NAME" > "\$FILE"
find /var/backups/fisioweb -name '*.dump' -mtime +7 -delete
echo "ok: \$FILE"
EOF
chmod 750 /usr/local/bin/fisioweb-backup

# ---------------------------------------------------------------------------
log "Pronto"
# ---------------------------------------------------------------------------
cat <<EOF

Servidor provisionado.

  App:      $APP_DIR (deploy faz o resto)
  .env:     $ENV_FILE  <- preencha R2, Google e e-mail
  PHP:      $(php -r 'echo PHP_VERSION;')
  Postgres: $(basename "$(dirname "$PG_CONF_DIR")")
  Cache:    $KV_SERVICE
  Node:     $(node --version)

Próximos passos estão em infra/README.md.
EOF
