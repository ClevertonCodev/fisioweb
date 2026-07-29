# Manual de operação

Guia do dia a dia do servidor `fisioweb-app` (Hetzner Cloud,
Falkenstein). Para a instalação inicial, veja [SETUP.md](SETUP.md).

Todos os comandos rodam a partir da raiz do repositório.

---

## Os scripts

Todos em `infra/nix/`.

| Script | Para que serve |
| --- | --- |
| `deploy.sh --ref <ref>` | Publica uma versão. É o comando do dia a dia. |
| `artisan.sh <cmd…>` | Roda um comando do Laravel no servidor. |
| `refresh-hashes.sh --ref <ref>` | Recalcula os hashes das dependências. Só quando `composer.lock` ou `package-lock.json` mudam. |
| `install.sh` | **Destrutivo.** Só na primeira instalação, ou para reconstruir o servidor do zero. |
| `nix.sh <args…>` | Roda `nix` avulso dentro do Docker. Para depuração. |

`common.sh` não é executável — é a biblioteca compartilhada pelos
outros.

---

## Publicar uma alteração

### Caso 1 — mudou só código PHP/JS

```bash
git checkout main && git pull
./infra/nix/deploy.sh --ref main
```

Confirme com `y`. O script:
1. Lê o estado do OpenTofu e regenera os arquivos derivados
   (`data-volume.nix`, `floating-ip.nix`, `secrets/app-url.env`,
   `secrets/r2-backup-creds`).
2. Compila e aplica a nova configuração no servidor.

Você pode publicar uma tag ou um commit específico:

```bash
./infra/nix/deploy.sh --ref v1.2.3
./infra/nix/deploy.sh --ref 4f2a1b9
```

> Publicar é sempre uma ação manual, feita da sua máquina. O GitHub não
> publica nada — os workflows de lá só rodam lint e testes. Isso é
> proposital: significa que nenhum sistema automatizado tem acesso de
> root ao servidor nem à chave que descriptografa os segredos.

### Caso 2 — mudou `composer.lock` ou `package-lock.json`

Aí os hashes precisam ser recalculados **antes** de publicar:

```bash
git checkout main && git pull
./infra/nix/refresh-hashes.sh --ref main
git add infra/nix/*.sha
git commit -m "infra: atualiza hashes das dependências"
git push
./infra/nix/deploy.sh --ref main
```

Se pular esse passo, o deploy falha com `hash mismatch in fixed-output
derivation`. Não é perigoso — só quer dizer "rode o refresh-hashes".

### Caso 3 — mudou só a configuração do servidor

Os arquivos em `infra/nix/modules/*.nix` são lidos do **seu computador**,
não do repositório remoto. Para aplicar uma mudança de configuração sem
mexer na versão do código:

```bash
./infra/nix/deploy.sh --ref <a mesma ref de antes>
```

Iterando em configuração? Pule as etapas lentas:

```bash
./infra/nix/deploy.sh --ref main --no-tofu-sync -y
```

`-y` pula a confirmação. Rode o deploy completo (sem atalhos) depois de
mexer em `infra/tofu/*`.

---

## Rodar comandos do Laravel

```bash
./infra/nix/artisan.sh migrate --force
./infra/nix/artisan.sh migrate:status
./infra/nix/artisan.sh cache:clear
./infra/nix/artisan.sh queue:work --stop-when-empty
./infra/nix/artisan.sh tinker
```

O script entra por SSH, descobre sozinho onde está a versão ativa da
aplicação e roda como o usuário `fisioweb`.

> ⚠️ `module:enable` e `module:disable` **não funcionam** no servidor.
> O `modules_statuses.json` fica dentro do Nix store, que é somente
> leitura. Quais módulos estão ativos é decidido em tempo de build:
> edite o arquivo, faça commit e publique.

---

## Ver o que está acontecendo

```bash
IP=$(mise exec -- tofu -chdir=infra/tofu output -raw app_floating_ipv4)

# logs da aplicação (PHP)
ssh eduardo@$IP 'sudo journalctl -u phpfpm-fisioweb -f'

# logs do servidor web
ssh eduardo@$IP 'sudo journalctl -u nginx -f'

# fila de jobs
ssh eduardo@$IP 'sudo journalctl -u fisioweb-queue-worker -f'

# estado geral dos serviços
ssh eduardo@$IP 'systemctl status phpfpm-fisioweb nginx postgresql redis fisioweb-queue-worker'

# tarefas agendadas
ssh eduardo@$IP 'systemctl list-timers'
```

Como o Laravel roda com `LOG_CHANNEL=stderr`, tudo que a aplicação
registra sai em `journalctl -u phpfpm-fisioweb`.

---

## Banco de dados

O Postgres só aceita conexão local, por socket, com autenticação por
usuário do sistema. Não existe senha.

```bash
IP=$(mise exec -- tofu -chdir=infra/tofu output -raw app_floating_ipv4)
ssh eduardo@$IP 'sudo -u fisioweb psql fisioweb'
```

### Backups

Um `pg_dump` criptografado sobe para o R2 todo dia às 03:00 UTC.

```bash
# rodar agora, sem esperar o horário
ssh eduardo@$IP 'sudo systemctl start pg-backup.service'
ssh eduardo@$IP 'sudo journalctl -u pg-backup.service -n 50'
```

**Restaurar** (no seu computador, não no servidor):

```bash
# listar os backups disponíveis
aws s3 ls s3://fisioweb-backups/postgres/

# restaurar um deles
aws s3 cp s3://fisioweb-backups/postgres/<data>/fisioweb.sql.zst.age - \
  | age -d -i ~/.config/sops/age/keys.txt \
  | zstd -d \
  | psql fisioweb
```

> O backup é criptografado com a **mesma chave age** dos segredos.
> Perder essa chave é perder os backups também.

---

## Adicionar uma pessoa à equipe

1. Peça a chave pública SSH dela (`cat ~/.ssh/id_ed25519.pub`).
2. Opcionalmente, uma senha para recuperação pelo console da Hetzner —
   gerada com `mkpasswd -m yescrypt`. Use `null` para dispensar.
3. Adicione em `keys.nix`, dentro de `operators`:

   ```nix
   cleverton = {
     pubkey         = "ssh-ed25519 AAAA…";
     hashedPassword = null;
     shell          = "bash";
   };
   ```

   O nome do atributo vira o usuário no servidor. Se o `whoami` da
   máquina da pessoa for diferente, ela precisa exportar
   `FISIOWEB_OPERATOR=cleverton`.
4. `./infra/nix/deploy.sh --ref <ref atual>`.
5. Para ela também publicar, precisa da chave age (passo 2 do SETUP).

---

## Trocar credenciais

| Credencial | Como trocar |
| --- | --- |
| Chaves R2 da aplicação | Gere novas no Cloudflare (conta `4925f2b7…`), depois `sops secrets/r2-app-creds.env` → `deploy.sh`. |
| Token da Hetzner | Gere um novo no console, depois `sops infra/tofu/credentials.env`. |
| Credenciais R2 do estado/backup | `sops infra/tofu/credentials.env`. **Atenção:** a conta `7c45003b…` é compartilhada com outro projeto — ao trocar, atualize os dois. |
| Configuração da aplicação (`.env`) | `sops secrets/app.env` → `deploy.sh`. |
| `APP_URL` | Não edite à mão. Vem do OpenTofu via `deploy.sh`. |

---

## Quando dá problema

### Não consigo mais entrar por SSH

Quase sempre é o seu IP público que mudou.

```bash
curl ifconfig.me
```

Coloque o valor em `admin_allowed_cidrs` no `infra/tofu/terraform.tfvars`
(com `/32` no final) e rode `tofu apply`.

Se nem isso resolver, use o **console web da Hetzner** (Cloud → servidor
→ Console) e entre com seu usuário e a senha do `hashedPassword`.

### `Error acquiring the state lock`

Um `tofu apply` anterior travou e deixou o estado bloqueado. A mensagem
mostra o ID do bloqueio:

```bash
cd infra/tofu
mise exec -- tofu force-unlock <id-do-lock>
```

### `hash mismatch in fixed-output derivation`

Alguém mexeu num lockfile e não rodou o `refresh-hashes.sh`. Veja o
"Caso 2" acima.

### O refresh-hashes fica em loop

Ele desiste depois de 6 tentativas. Duas causas comuns:

- **Derivação renomeada** — o script imprime o `.drv` que não reconheceu.
  Ajuste os padrões do `case` em `infra/nix/refresh-hashes.sh`.
- **O código não compila** naquela ref. A saída do build é despejada;
  leia de baixo para cima até o erro real.

### O deploy passou mas o site não responde

```bash
ssh eduardo@$IP 'systemctl status nginx phpfpm-fisioweb'
ssh eduardo@$IP 'sudo journalctl -u phpfpm-fisioweb -n 100'
```

Erro de "class not found" logo após um deploy costuma ser cache velho do
Laravel. Ele é limpo automaticamente a cada ativação, mas você pode
forçar:

```bash
./infra/nix/artisan.sh config:clear
./infra/nix/artisan.sh cache:clear
```

### Voltar para a versão anterior

Publique a ref antiga:

```bash
./infra/nix/deploy.sh --ref v1.2.2
```

Para uma reversão imediata, sem recompilar, dá para trocar a geração
direto no servidor:

```bash
ssh eduardo@$IP 'sudo nix-env --list-generations --profile /nix/var/nix/profiles/system'
ssh eduardo@$IP 'sudo /nix/var/nix/profiles/system-<N>-link/bin/switch-to-configuration switch'
```

> ⚠️ Isso **não** desfaz migrações de banco. Se a versão nova rodou
> `migrate`, reverter o código pode deixá-lo incompatível com o schema.

### Perdi a chave age

Se ainda existir uma cópia em qualquer máquina: adicione um segundo
destinatário no `.sops.yaml` e rode `sops updatekeys` em cada arquivo de
`secrets/`.

Se **todas** as cópias sumiram, os segredos não são recuperáveis. Será
preciso gerar tudo de novo: novo `APP_KEY`, novo `JWT_SECRET` (derruba
todas as sessões), novas chaves de R2, e os backups antigos viram lixo.

---

## O que não está aqui

- **Instalação inicial** — [SETUP.md](SETUP.md).
- **Domínio e HTTPS** — [DOMINIO.md](DOMINIO.md).
- **Detalhes do OpenTofu** — [tofu/README.md](tofu/README.md).
- **Desenvolvimento local** — Sail, veja o `README.md` da raiz.
