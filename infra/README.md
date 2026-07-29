# Infraestrutura do fisioweb

Tudo que coloca e mantém o fisioweb no ar.

## Por onde começar

| Se você quer… | Leia |
| --- | --- |
| Instalar do zero, primeira vez | [SETUP.md](SETUP.md) |
| Publicar uma alteração, ver logs, resolver problema | [DEPLOY.md](DEPLOY.md) |
| Ligar um domínio e HTTPS | [DOMINIO.md](DOMINIO.md) |
| Entender o que existe na nuvem | [tofu/README.md](tofu/README.md) |

## Como funciona, em resumo

```
  seu computador                       Hetzner Cloud
  ┌──────────────────┐                 ┌────────────────────────┐
  │ infra/tofu/      │  cria/atualiza  │  servidor  fisioweb-app│
  │   (OpenTofu)     │ ───────────────▶│  IP fixo               │
  │                  │                 │  disco  /srv/data      │
  │ infra/nix/       │                 │                        │
  │   deploy.sh      │  nixos-rebuild  │  NixOS                 │
  │   (NixOS+Nix)    │ ───────────────▶│   ├── nginx  :80       │
  │                  │                 │   ├── php-fpm          │
  │ secrets/*.env    │                 │   ├── postgres 18      │
  │   (sops+age)     │                 │   ├── valkey           │
  └──────────────────┘                 │   ├── fila de jobs     │
                                       │   └── backup diário ──▶ R2
                                       └────────────────────────┘
```

Três camadas, cada uma com uma responsabilidade:

1. **OpenTofu** (`infra/tofu/`) — cria as máquinas. Não sabe nada sobre
   a aplicação.
2. **NixOS** (`infra/nix/`) — descreve o sistema inteiro num arquivo:
   quais serviços rodam, com qual versão de PHP, com quais permissões. O
   servidor é reconstruível a partir daqui.
3. **sops** (`secrets/`) — as senhas, criptografadas com uma chave age e
   versionadas no git. O servidor descriptografa sozinho no boot.

O valor de fazer assim: o servidor é **descartável**. Se ele pegar fogo,
`tofu apply` + `install.sh` + `deploy.sh` reconstroem tudo igual, e o
banco volta do backup.

## Coisas importantes de saber

- **Não existe domínio ainda.** O acesso é por `http://IP`, sem HTTPS. O
  login com Google não funciona por causa disso — ver
  [DOMINIO.md](DOMINIO.md).
- **A chave age é o segredo mais importante do projeto.** Ela
  descriptografa tudo, inclusive os backups. Perdê-la é irreversível.
- **Uploads vão para o Cloudflare R2**, não para o disco do servidor.
- **Publicar é manual**, sempre da máquina de quem opera. O GitHub não
  tem acesso ao servidor nem às chaves — os workflows de lá só rodam
  lint e testes.

## Estrutura

```
infra/
├── README.md          este arquivo
├── SETUP.md           instalação do zero (passo a passo)
├── DEPLOY.md          manual de operação
├── DOMINIO.md         como ligar domínio + HTTPS
├── tofu/              OpenTofu: servidor, IP, disco, firewall, bucket
└── nix/
    ├── common.sh      biblioteca compartilhada pelos scripts
    ├── deploy.sh      publicar  ← o comando do dia a dia
    ├── install.sh     instalação inicial (destrutivo)
    ├── artisan.sh     rodar comandos do Laravel no servidor
    ├── refresh-hashes.sh  recalcular hashes das dependências
    ├── nix.sh         escape hatch para comandos nix avulsos
    ├── *.sha          hashes fixados das dependências
    └── modules/       a configuração do NixOS
```
