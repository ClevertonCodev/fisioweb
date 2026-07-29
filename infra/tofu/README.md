# OpenTofu — Hetzner + R2

Provisionamento da infraestrutura do fisioweb. Para instalar do zero,
siga [../SETUP.md](../SETUP.md); este documento explica **o que** existe
aqui e **por quê**.

---

## O que o OpenTofu controla

| Recurso | Arquivo | Observação |
| --- | --- | --- |
| Servidor (cx23, Debian→NixOS) | `server.tf` | A imagem só é usada no primeiro boot; o `install.sh` troca por NixOS logo depois. |
| IP fixo (Floating IP) | `floating_ip.tf` | Endereço público estável. Sobrevive à recriação do servidor. Protegido contra exclusão. |
| Disco de dados (40 GB) | `volume.tf` | Montado em `/srv/data`. Guarda Postgres, Valkey e o storage do Laravel. Protegido contra exclusão. |
| Firewall | `firewall.tf` | SSH só do seu IP; 80/443 abertos ao público. |
| Chave SSH | `ssh_key.tf` | Autorizada no primeiro boot. |
| Bucket de backups | `r2.tf` | `fisioweb-backups`, na conta Cloudflare `7c45003b…`. |

Custo aproximado: **~€10/mês** (servidor + IP + disco). O R2 cobra por
uso e, no volume esperado, fica abaixo de €1/mês. Saída de dados no R2
é gratuita.

---

## O que o OpenTofu **não** controla

- **O bucket `fisioweb-tfstate`.** É criado à mão. Problema do ovo e da
  galinha: é ele que guarda o estado do próprio OpenTofu.
- **O bucket `fisioweb`** (uploads da aplicação). Fica em **outra conta
  Cloudflare** (`4925f2b7…`), é anterior a esta infraestrutura, e
  continua gerenciado manualmente. Trazê-lo para cá exigiria criar um
  token novo naquela conta sem ganho real. As credenciais dele vivem em
  `secrets/r2-app-creds.env` e só o Laravel as usa.
- **A configuração do sistema operacional.** Isso é NixOS, em
  `infra/nix/`.
- **DNS e certificados.** Ainda não existe domínio. Ver
  [../DOMINIO.md](../DOMINIO.md).

---

## As duas contas Cloudflare

Isto confunde à primeira vista, então vale explicitar:

```
Conta 7c45003b…  (compartilhada com outro projeto nosso)
├── fisioweb-tfstate    estado do OpenTofu   (criado à mão)
└── fisioweb-backups    backups do banco     (criado pelo OpenTofu)
        credenciais: infra/tofu/credentials.env — já existiam

Conta 4925f2b7…  (a conta do fisioweb)
└── fisioweb            uploads da aplicação (gerenciado à mão)
        credenciais: secrets/r2-app-creds.env
```

Foi essa separação que permitiu subir o projeto **sem criar nenhuma
credencial nova de Cloudflare**. A única credencial criada do zero foi o
token da Hetzner.

---

## Estado

O estado fica em `s3://fisioweb-tfstate/terraform.tfstate`, no R2.

- **Criptografia:** o OpenTofu criptografa o arquivo com AES-GCM
  **antes** de enviar (`encryption.tf`). O R2 nunca vê o conteúdo em
  claro. Isso importa: o estado contém o token da Hetzner e todos os
  atributos dos recursos.
- **Senha:** fica em `secrets/operator/tfstate-passphrase`, criptografada
  com sops e **nunca** enviada ao servidor. O direnv a carrega ao entrar
  nesta pasta.
- **Trava:** `use_lockfile = true`. O R2 suporta escrita condicional,
  então duas execuções simultâneas não se atropelam.
- **Versionamento:** **não existe no R2.** O painel não oferece, e a API
  S3 responde `PutBucketVersioning not implemented`. Diferente do S3 da
  AWS, não há como voltar a uma revisão anterior do estado pelo bucket.

> ⚠️ Sem versionamento, a proteção contra uma gravação ruim é você
> mesmo. Antes de operação arriscada (`destroy`, troca de provider,
> refatoração grande):
>
> ```bash
> mise exec -- tofu state pull > "tfstate-backup-$(date +%Y%m%d-%H%M%S).json"
> ```
>
> O `.gitignore` já cobre esses arquivos. Guarde-os fora do repositório:
> saem **descriptografados**. Restaure com `tofu state push <arquivo>`.

> ⚠️ **Perder a senha do estado = perder o acesso ao estado.** A senha e
> a chave age que a protege precisam sobreviver. Sem elas, seria preciso
> reimportar cada recurso na mão.

---

## Uso

```bash
cd infra/tofu

mise exec -- tofu plan     # ver o que mudaria
mise exec -- tofu apply    # aplicar
mise exec -- tofu output   # ver IPs e caminhos
```

Com o direnv configurado, as credenciais carregam sozinhas ao entrar na
pasta. Sem ele:

```bash
export TF_VAR_state_passphrase="$(mise exec -- sops -d ../../secrets/operator/tfstate-passphrase)"
set -a; source <(mise exec -- sops -d credentials.env); set +a
```

---

## Depois de um `tofu apply`

O `apply` mexe só na nuvem — não altera nenhum arquivo local. Para
trazer os valores novos para o repositório, rode um deploy:

```bash
./infra/nix/deploy.sh --ref <ref atual>
git add secrets/ infra/nix/modules/{data-volume,floating-ip}.nix
git commit -m "infra: sincroniza estado do tofu"
```

É o `deploy.sh` que gera, a partir dos outputs:

- `infra/nix/modules/data-volume.nix` — onde `/srv/data` é montado
- `infra/nix/modules/floating-ip.nix` — o IP amarrado à placa de rede
- `secrets/app-url.env` — `APP_URL` e `GOOGLE_REDIRECT_URI`
- `secrets/r2-backup-creds` — credenciais do backup noturno

Esse é o motivo de o IP não estar escrito à mão em lugar nenhum: ele
existe num lugar só (o estado do OpenTofu) e desce para todo o resto.

---

## Coisas que assustam mas são normais

**O plano quer recriar o servidor.**
Isso **apaga a máquina**. Só é esperado se você mudou `server_type_app`,
`location` ou `image` de propósito. Fora isso, pare e investigue. O
disco e o IP sobrevivem (têm `delete_protection`), mas o sistema
instalado não — seria preciso rodar o `install.sh` de novo.

**`Error acquiring the state lock`.**
Uma execução anterior travou. Veja [../DEPLOY.md](../DEPLOY.md), seção
"Quando dá problema".
