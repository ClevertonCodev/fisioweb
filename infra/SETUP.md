# Setup — do zero até a aplicação no ar

Guia passo a passo para colocar o fisioweb em produção pela primeira
vez. Siga **na ordem**. Cada passo diz o que fazer, o que você deve ver
quando dá certo, e o que fazer quando dá errado.

> **Você só precisa criar UMA credencial nova**: o token da Hetzner
> (passo 4). As credenciais de Cloudflare já existem e são
> reaproveitadas.

**Tempo estimado:** 1h30, sendo ~40 min de espera do computador
compilando.

---

## Antes de começar

Você vai precisar de:

- Um computador com **Linux ou macOS** (não funciona no Windows puro;
  use WSL2 se for Windows).
- **Docker** instalado e rodando.
- Acesso ao repositório `ClevertonCodev/fisioweb` no GitHub.
- Acesso ao painel da Hetzner Cloud.
- A **chave age** do operador (arquivo `keys.txt`). Sem ela nada aqui
  funciona — veja o passo 2.

Abra um terminal e vá para a pasta do projeto. **Todos** os comandos
deste guia rodam a partir daí:

```bash
cd ~/Documentos/fisioweb
```

---

## Passo 1 — Instalar as ferramentas

Instale o `mise` (gerenciador de versões) se ainda não tiver:

```bash
curl https://mise.run | sh
```

Agora instale as ferramentas do projeto:

```bash
mise install
```

**Como saber se deu certo:**

```bash
mise exec -- sops --version
mise exec -- tofu --version
```

Você deve ver `sops 3.13.x` e `OpenTofu v1.12.x`.

> **Dica:** se digitar `sops` sozinho e disser "comando não encontrado",
> use `mise exec -- sops ...` na frente de todo comando `sops` ou
> `tofu` deste guia. Ou rode `mise activate` conforme a documentação do
> mise para não precisar do prefixo.

Confirme também que o Docker está rodando:

```bash
docker ps
```

Se aparecer uma tabela (mesmo vazia), está certo. Se der erro de
conexão, inicie o Docker antes de continuar.

---

## Passo 2 — Colocar a chave age no lugar

Esta é a chave que descriptografa todos os segredos do projeto.

O arquivo precisa estar exatamente aqui:

```
~/.config/sops/age/keys.txt
```

**Se você já tem:**

```bash
ls -l ~/.config/sops/age/keys.txt
```

Se listar o arquivo, pule para o passo 3.

**Se você não tem**, peça o arquivo para quem administra o projeto e
salve nesse caminho:

```bash
mkdir -p ~/.config/sops/age
# copie o conteúdo recebido para dentro do arquivo:
nano ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

**Como saber se deu certo:**

```bash
mise exec -- sops -d secrets/app.env | head -5
```

Deve aparecer texto legível (comentários e `APP_NAME=Fisioweb`).

**Se der erro** `no key could be found` ou `failed to decrypt`: a chave
está errada ou no lugar errado. Confira se o arquivo começa com
`AGE-SECRET-KEY-1`.

> ⚠️ **Nunca** mande essa chave por WhatsApp, e-mail ou Slack. Use um
> gerenciador de senhas ou entregue pessoalmente. Quem tem essa chave
> tem acesso ao banco de dados, ao JWT e ao Cloudflare.

---

## Passo 3 — Gerar a chave SSH do servidor

Esta é a identidade do servidor. Ela é gerada **uma vez** e guardada
para sempre.

```bash
mkdir -p ~/Sync/profile/.ssh
ssh-keygen -t ed25519 -f ~/Sync/profile/.ssh/fisioweb-app-host -N ''
```

Agora copie a parte pública para dentro do `keys.nix`:

```bash
cat ~/Sync/profile/.ssh/fisioweb-app-host.pub
```

Abra o arquivo `keys.nix` na raiz do projeto, ache a linha:

```nix
  fisiowebApp = "PASTE_THE_CONTENTS_OF_fisioweb-app-host.pub_HERE";
```

E troque o texto entre aspas pelo que o `cat` mostrou. Deve ficar algo
como:

```nix
  fisiowebApp = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... usuario@maquina";
```

**Como saber se deu certo:**

```bash
grep PASTE_THE_CONTENTS keys.nix
```

Não deve retornar nada. Se retornar, o texto ainda não foi trocado.

> **Guarde o arquivo `fisioweb-app-host` (sem `.pub`) num lugar seguro
> e com backup.** Se perder, você terá que reinstalar o servidor do
> zero.

Confirme também que sua chave SSH pessoal está carregada:

```bash
ssh-add -l
```

Se disser "The agent has no identities", rode `ssh-add` antes de
continuar.

---

## Passo 4 — Criar o token da Hetzner

**Esta é a única credencial nova que você precisa criar.**

O token dá permissão para o OpenTofu criar o servidor, o IP e o disco.

1. Acesse <https://console.hetzner.cloud> e faça login.
2. Na tela inicial aparecem os **projetos**. Clique no projeto do
   **fisioweb**.
   > ⚠️ Confira que é o projeto certo. O token só funciona dentro do
   > projeto onde foi criado, e criar o servidor no projeto errado é
   > chato de desfazer.
3. No **menu lateral esquerdo**, procure a seção de segurança —
   atualmente chamada **"Security"** (ícone de cadeado/chave).
4. Dentro dela, abra a aba **"API tokens"**.
5. Clique no botão de gerar token — atualmente **"Generate API token"**
   (canto superior direito da lista).
6. Preencha:
   - **Description / Name:** `fisioweb-tofu`
   - **Permissions:** selecione **Read & Write**
     > ⚠️ Se deixar em "Read", o `tofu apply` falha com erro de
     > permissão (403). Precisa ser **Read & Write**.
7. Clique em **"Generate API token"**.
8. **O token aparece UMA ÚNICA VEZ.** Copie agora. Se fechar a tela sem
   copiar, apague o token e crie outro — não tem como ver de novo.

Agora salve o token no arquivo de credenciais:

```bash
mise exec -- sops infra/tofu/credentials.env
```

Isso abre um editor de texto com o conteúdo já descriptografado. Ache a
última linha:

```
TF_VAR_hcloud_token=
```

Cole o token logo depois do `=`, **sem espaços e sem aspas**:

```
TF_VAR_hcloud_token=abcdef1234567890abcdef1234567890abcdef12
```

Salve e feche o editor (no `nano`: `Ctrl+O`, `Enter`, `Ctrl+X`). O sops
re-criptografa sozinho ao salvar.

**Como saber se deu certo:**

```bash
mise exec -- sops -d infra/tofu/credentials.env | grep hcloud
```

Deve mostrar `TF_VAR_hcloud_token=` seguido do seu token.

> **Se o editor não abrir** ou abrir num programa que você não sabe
> usar, defina outro antes:
> `export EDITOR=nano` e rode o comando `sops` de novo.

---

## Passo 5 — Criar o bucket do estado no Cloudflare

O OpenTofu guarda o "mapa" da infraestrutura num arquivo de estado.
Esse arquivo mora num bucket R2 que precisa existir **antes** — o
OpenTofu não consegue criar o bucket que guarda o próprio estado dele.

> Este bucket fica numa conta Cloudflare que já usamos (`7c45003b…`),
> e não na conta onde estão os uploads do fisioweb. Isso é de
> propósito: é o que evita ter que criar credenciais novas.

1. Acesse <https://dash.cloudflare.com> e faça login.
2. Se você tem mais de uma conta, escolha a que tem o ID começando com
   **`7c45003b`**.
3. No menu lateral esquerdo, clique em **"R2 Object Storage"**.
4. Clique em **"Create bucket"**.
5. Preencha:
   - **Bucket name:** `fisioweb-tfstate` (exatamente assim)
   - **Location / Jurisdiction:** escolha **European Union (EU)**
     > ⚠️ Isto é obrigatório. O endereço configurado no projeto tem
     > `.eu.` no meio. Se criar fora da UE, o `tofu init` falha com
     > erro de bucket não encontrado.
6. Clique em **"Create bucket"**.

Não mexa em mais nada. Todo o resto (URL pública desligada, sem domínio
personalizado, classe Standard) já vem correto por padrão.

> ⚠️ **Não** crie uma *Bucket Lock Rule* neste bucket. Ela impede
> sobrescrever objetos — e o OpenTofu sobrescreve o arquivo de estado a
> cada `apply`. Ligar isso trava o projeto inteiro.

**Como saber se deu certo:** o bucket `fisioweb-tfstate` aparece na
lista de buckets com a jurisdição **European Union (EU)**.

### Sobre versionamento

Se você já usou S3, deve estar procurando por *versionamento* de bucket
para poder voltar a uma revisão anterior do estado.

**O R2 não tem isso.** Não aparece no painel, e a API responde
`NotImplemented`:

```
PutBucketVersioning not implemented
```

Verificado, não é falta de procurar. Em vez disso, tire uma cópia do
estado antes de qualquer operação arriscada (`destroy`, mudança de
provider, refatoração grande):

```bash
cd infra/tofu
mise exec -- tofu state pull > "tfstate-backup-$(date +%Y%m%d-%H%M%S).json"
```

Esses arquivos já estão no `.gitignore` — guarde-os fora do repositório,
porque saem **descriptografados**. Para restaurar:
`mise exec -- tofu state push <arquivo>`.

---

## Passo 6 — Ligar o direnv (opcional, mas recomendado)

O `direnv` carrega as credenciais automaticamente quando você entra na
pasta `infra/tofu`. Sem ele, você precisa carregar na mão toda vez.

```bash
mise use -g direnv
direnv --version
```

Adicione o hook ao seu shell (uma vez só) conforme
<https://direnv.net/docs/hook.html>, reabra o terminal e autorize:

```bash
cd infra/tofu
direnv allow
cd ../..
```

**Como saber se deu certo:** ao entrar em `infra/tofu` aparece uma
mensagem `direnv: loading ...` e vários `direnv: export ...`.

---

## Passo 7 — Criar a infraestrutura

Agora sim, criando servidor, IP fixo, disco e firewall.

```bash
cd infra/tofu
mise exec -- tofu init
```

**Como saber se deu certo:** aparece
`OpenTofu has been successfully initialized!`.

**Se der erro** `NoSuchBucket` ou `bucket does not exist`: o bucket do
passo 5 não foi criado, está com nome diferente, ou não está na
jurisdição EU.

Agora veja o que vai ser criado, **sem criar nada ainda**:

```bash
mise exec -- tofu plan
```

Leia o resumo no final. Deve dizer algo como:

```
Plan: 8 to add, 0 to change, 0 to destroy.
```

> ⚠️ Se aparecer qualquer coisa em **`destroy`**, **PARE** e peça ajuda.
> Numa instalação nova nada deve ser destruído.

Se estiver tudo certo, crie de verdade:

```bash
mise exec -- tofu apply
```

Ele mostra o plano de novo e pergunta. Digite `yes` e `Enter`.

Isso leva 1 a 2 minutos. No final aparecem os **outputs**.

### Anotar o endereço

```bash
mise exec -- tofu output -raw app_floating_ipv4
```

Guarde esse número (algo como `5.75.221.206`) — é o endereço público da
aplicação. **Você não precisa colar isso em lugar nenhum**: o
`install.sh` e o `deploy.sh` leem o valor direto do OpenTofu e o gravam
sozinhos nos arquivos que precisam dele.

Volte para a raiz:

```bash
cd ../..
```

---

## Passo 8 — Instalar o sistema operacional no servidor

Este passo **apaga tudo** que estiver no servidor e instala o NixOS.
Numa máquina recém-criada não há nada para perder.

```bash
./infra/nix/install.sh
```

Ele vai:
1. Buscar as informações do OpenTofu e gerar arquivos de configuração.
2. Baixar o ambiente Nix dentro do Docker (**demora 10 a 15 minutos na
   primeira vez** — é normal, deixe rodando).
3. Reinstalar o servidor.

**Como saber se deu certo:** no final aparece `==> install complete.`

Teste o acesso:

```bash
ssh eduardo@$(mise exec -- tofu -chdir=infra/tofu output -raw app_floating_ipv4)
```

Deve entrar no servidor. Digite `exit` para sair.

**Se der erro:**

| Erro | O que fazer |
| --- | --- |
| `keys.nix still contains the fisiowebApp placeholder` | Volte ao passo 3, item do `keys.nix`. |
| `Permission denied (publickey)` | Rode `ssh-add` e confirme com `ssh-add -l`. |
| `Connection timed out` | Seu IP público mudou. Rode `curl ifconfig.me`, coloque o valor em `admin_allowed_cidrs` no `terraform.tfvars` (com `/32` no final) e rode `tofu apply` de novo. |

---

## Passo 9 — Calcular os hashes e publicar a aplicação

O Nix precisa saber o "impressão digital" das dependências (composer e
npm). Isso é calculado uma vez e guardado no repositório.

```bash
./infra/nix/refresh-hashes.sh --ref main
```

**Demora bastante** (compila as dependências). No final aparece
`==> hashes up to date.`

Salve o resultado no git:

```bash
git add infra/nix/composer-vendor.sha infra/nix/npm-deps.sha
git commit -m "infra: hashes iniciais"
```

Agora publique a aplicação:

```bash
./infra/nix/deploy.sh --ref main
```

Ele mostra um resumo e pergunta `Continue? [y/N]`. Digite `y`.

**Como saber se deu certo:** no final aparece `==> deploy complete.`

Crie as tabelas do banco:

```bash
./infra/nix/artisan.sh migrate --force
```

---

## Passo 10 — Testar

Descubra o endereço:

```bash
mise exec -- tofu -chdir=infra/tofu output -raw app_floating_ipv4
```

Abra `http://SEU_IP` no navegador. A aplicação deve carregar.

Teste também pelo terminal:

```bash
curl -I http://SEU_IP
```

Deve responder `HTTP/1.1 200 OK`.

**Se não carregar**, veja os registros do servidor:

```bash
ssh eduardo@SEU_IP 'sudo journalctl -u phpfpm-fisioweb -n 50'
ssh eduardo@SEU_IP 'sudo journalctl -u nginx -n 50'
```

---

## Sobre o GitHub

Não há nada para configurar no GitHub. **Publicar é sempre manual**,
feito da sua máquina com o `deploy.sh`.

Os workflows que existem no repositório (`lint` e `tests`) só verificam
o código nos *pull requests*. Eles não têm acesso ao servidor nem às
chaves.

Isso é uma decisão de segurança, não uma pendência. Um deploy automático
exigiria guardar no GitHub:

- a **chave age**, que descriptografa todos os segredos (banco, JWT,
  Cloudflare, Google); e
- uma **chave SSH com poder de root** no servidor.

Com as duas lá, qualquer pessoa capaz de dar merge na `main` — ou de
alterar o arquivo do próprio workflow num pull request — chegaria à
produção e leria os dados dos pacientes. Como o sistema guarda dados de
saúde (dados sensíveis pela LGPD), o custo desse erro é alto demais para
o ganho de conveniência.

Mantendo o deploy local, a chave age existe em apenas dois lugares: a
máquina de quem opera e o próprio servidor.

---

## O que ficou faltando (de propósito)

- **Domínio e HTTPS.** Hoje o acesso é por `http://IP`, sem cadeado. Ver
  [DOMINIO.md](DOMINIO.md).
- **Login com Google (agenda).** **Não funciona** enquanto não houver
  domínio: o Google recusa endereços de IP puro como URL de retorno.
  Está detalhado em [DOMINIO.md](DOMINIO.md).
- **Envio de e-mail.** `MAIL_MAILER=log` — os e-mails são escritos no
  log em vez de enviados.
- **Monitoramento.** Não há painéis nem alertas ainda.

---

## Para o dia a dia

Depois de tudo instalado, você usa só isto:

```bash
# publicar uma versão
./infra/nix/deploy.sh --ref v1.2.3

# rodar um comando do Laravel no servidor
./infra/nix/artisan.sh migrate --force
./infra/nix/artisan.sh cache:clear
```

O manual completo de operação está em [DEPLOY.md](DEPLOY.md).
