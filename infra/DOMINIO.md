# Ligar um domínio (e HTTPS)

Hoje o fisioweb responde em `http://<IP>`, sem domínio e sem cadeado.
Isso foi uma decisão consciente para colocar no ar rápido, e a
infraestrutura já foi escrita pensando na troca.

Este documento é a receita completa dessa troca. Ela leva cerca de uma
hora e derruba o site por poucos segundos.

---

## O que muda quando existe um domínio

| Hoje | Depois |
| --- | --- |
| `http://5.75.221.206` | `https://app.fisioweb.com.br` |
| Sem criptografia | HTTPS ponta a ponta |
| Portas 80/443 abertas para o mundo | Só a rede da Cloudflare alcança o servidor |
| **Login com Google não funciona** | Funciona |
| Navegador mostra "Não seguro" | Cadeado normal |

---

## Por que o login com Google não funciona hoje

Não é um bug do fisioweb. O Google **recusa** URLs de retorno OAuth que
sejam endereços de IP: a política dele só aceita nomes de domínio, com
uma única exceção para `http://localhost` em desenvolvimento.

Ou seja, com `GOOGLE_REDIRECT_URI=http://5.75.221.206/...` o Google
responde `Error 400: invalid_request` antes mesmo de mostrar a tela de
login. Não há configuração no nosso lado que contorne isso.

A integração de agenda volta a funcionar assim que os passos abaixo
forem concluídos — sem mexer no código da aplicação.

---

## Pré-requisitos

1. Um domínio registrado (ex.: `fisioweb.com.br`).
2. Esse domínio adicionado a uma conta Cloudflare, com os *nameservers*
   já apontando para a Cloudflare (a Cloudflare mostra o passo a passo
   ao adicionar o site).
3. Decidir o endereço final. Recomendação: `app.fisioweb.com.br`.

Anote dois valores do painel da Cloudflare (Overview do domínio, coluna
da direita):
- **Zone ID**
- **Account ID**

---

## Passo 1 — Credencial da Cloudflare

Se o domínio estiver numa conta Cloudflare **diferente** da que já
usamos (`7c45003b…`), será preciso um token novo:

1. <https://dash.cloudflare.com> → ícone do perfil → **API Tokens**
2. **Create Token** → **Create Custom Token**
3. Permissões:
   - `Zone` → `DNS` → **Edit**
   - `Zone` → `SSL and Certificates` → **Edit**
4. **Zone Resources:** limite ao domínio do fisioweb.
5. Copie o token e guarde em `infra/tofu/credentials.env`
   (`mise exec -- sops infra/tofu/credentials.env`).

Se o domínio estiver na mesma conta que já usamos, o
`CLOUDFLARE_API_TOKEN` existente pode servir — desde que tenha as
permissões acima.

---

## Passo 2 — DNS e certificado no OpenTofu

Crie `infra/tofu/dns.tf`:

```hcl
variable "app_domain" {
  description = "Hostname público da aplicação."
  type        = string
  default     = "app.fisioweb.com.br"
}

variable "cloudflare_zone_id" {
  description = "Zone ID do domínio na Cloudflare."
  type        = string
}

# A Cloudflare fica na frente (proxied = true): o navegador fala com a
# Cloudflare, e a Cloudflare fala com o nosso IP. É isso que permite
# usar o certificado Origin CA do passo seguinte.
resource "cloudflare_dns_record" "app" {
  zone_id  = var.cloudflare_zone_id
  name     = var.app_domain
  content  = hcloud_floating_ip.app.ip_address
  type     = "A"
  proxied  = true
  ttl      = 1
  settings = {}
}
```

E `infra/tofu/origin_cert.tf`:

```hcl
# Certificado Origin CA: só a borda da Cloudflare confia nele. É o que
# criptografa o trecho Cloudflare -> nosso servidor. O trecho
# navegador -> Cloudflare usa o certificado da própria Cloudflare.
#
# 15 anos (5475 dias) é o máximo permitido.
resource "tls_private_key" "origin" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem
  subject { common_name = var.app_domain }
  dns_names = [var.app_domain, "*.${var.app_domain}"]
}

resource "cloudflare_origin_ca_certificate" "origin" {
  csr = tls_cert_request.origin.cert_request_pem
  # A API devolve os hostnames em ordem alfabética; sem o sort() o
  # plano acusa diferença e recria o certificado toda vez.
  hostnames          = sort(tls_cert_request.origin.dns_names)
  request_type       = "origin-rsa"
  requested_validity = 5475
}
```

Adicione o provider `tls` em `main.tf`, dentro de `required_providers`:

```hcl
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
```

E em `outputs.tf`:

```hcl
output "origin_cert_pem" {
  value     = cloudflare_origin_ca_certificate.origin.certificate
  sensitive = true
}

output "origin_key_pem" {
  value     = tls_private_key.origin.private_key_pem
  sensitive = true
}

output "app_domain" {
  value = var.app_domain
}
```

Defina o `cloudflare_zone_id` no `terraform.tfvars` e aplique:

```bash
cd infra/tofu
mise exec -- tofu init   # baixa o provider tls
mise exec -- tofu apply
cd ../..
```

---

## Passo 3 — Fechar o firewall

Com a Cloudflare na frente, ninguém precisa mais falar direto com o
servidor. Em `infra/tofu/firewall.tf`, troque as regras 80 e 443:

```hcl
  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = data.cloudflare_ip_ranges.cf.ipv4_cidrs
    description = "HTTP da borda da Cloudflare"
  }

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = data.cloudflare_ip_ranges.cf.ipv4_cidrs
    description = "HTTPS da borda da Cloudflare"
  }
```

E adicione em `lookups.tf` (arquivo novo):

```hcl
# Faixas de IP da Cloudflare, lidas a cada plano — assim o firewall
# acompanha as mudanças delas a cada `tofu apply`.
data "cloudflare_ip_ranges" "cf" {}
```

> ⚠️ Aplique isto **só depois** que o DNS estiver funcionando. Se
> fechar antes, o site fica inacessível.

---

## Passo 4 — Entregar o certificado ao servidor

Em `infra/nix/common.sh`, dentro de `sync_tofu_state()`, acrescente:

```bash
  write_if_changed_sops_binary "$secrets_dir/origin-cert.pem" \
    "$(tofu -chdir="$tofu_dir" output -raw origin_cert_pem)"
  write_if_changed_sops_binary "$secrets_dir/origin-key.pem" \
    "$(tofu -chdir="$tofu_dir" output -raw origin_key_pem)"
```

E troque o bloco que gera `app-url.env` para usar o domínio:

```bash
  local domain
  domain=$(tofu -chdir="$tofu_dir" output -raw app_domain)
  write_if_changed_sops_dotenv "$secrets_dir/app-url.env" "$(cat <<EOF
APP_URL=https://${domain}
GOOGLE_REDIRECT_URI=https://${domain}/api/clinic/google-calendar/callback
EOF
)"
```

Autorize os arquivos novos no `.sops.yaml`:

```yaml
  - path_regex: ^secrets/origin-.*\.pem$
    age:
      - *fisioweb
```

---

## Passo 5 — Ligar o HTTPS no nginx

Em `infra/nix/modules/fisioweb-app.nix`, no bloco `virtualHosts."_"`,
acrescente:

```nix
      addSSL = true;
      sslCertificate    = "/run/secrets/origin-cert";
      sslCertificateKey = "/run/secrets/origin-key";
```

E declare os segredos no bloco `sops`:

```nix
    secrets.origin-cert = {
      sopsFile = ../../../secrets/origin-cert.pem;
      owner = "nginx"; group = "nginx"; mode = "0444";
    };
    secrets.origin-key = {
      sopsFile = ../../../secrets/origin-key.pem;
      owner = "nginx"; group = "nginx"; mode = "0400";
    };
```

### O IP real do visitante

Com a Cloudflare na frente, todo acesso chega com o IP **dela**. Sem o
ajuste abaixo, os logs e o `request()->ip()` do Laravel mostram a
Cloudflare em vez do usuário. Acrescente em `services.nginx`:

```nix
    commonHttpConfig = ''
      ${lib.concatMapStringsSep "\n" (r: "set_real_ip_from ${r};") [
        "103.21.244.0/22"  "103.22.200.0/22"  "103.31.4.0/22"
        "104.16.0.0/13"    "104.24.0.0/14"    "108.162.192.0/18"
        "131.0.72.0/22"    "141.101.64.0/18"  "162.158.0.0/15"
        "172.64.0.0/13"    "173.245.48.0/20"  "188.114.96.0/20"
        "190.93.240.0/20"  "197.234.240.0/22" "198.41.128.0/17"
      ]}
      real_ip_header CF-Connecting-IP;
      real_ip_recursive on;
    '';
```

> ⚠️ Só adicione `real_ip_header` **junto** com o fechamento do firewall
> do passo 3. Se o servidor aceitar conexões diretas e ao mesmo tempo
> confiar no cabeçalho `CF-Connecting-IP`, qualquer pessoa pode forjar o
> próprio IP — quebrando limite de tentativas, auditoria e bloqueios.

Publique:

```bash
./infra/nix/deploy.sh --ref main
```

---

## Passo 6 — Ajustar o Google

1. <https://console.cloud.google.com> → **APIs e Serviços** →
   **Credenciais**
2. Abra o cliente OAuth do fisioweb.
3. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   https://app.fisioweb.com.br/api/clinic/google-calendar/callback
   ```
4. Em **Origens JavaScript autorizadas**, adicione:
   ```
   https://app.fisioweb.com.br
   ```
5. Salve. Pode levar alguns minutos para valer.

---

## Passo 7 — Conferir

```bash
# certificado válido, sem aviso
curl -I https://app.fisioweb.com.br

# o IP não deve mais responder direto
curl --max-time 10 http://5.75.221.206      # deve dar timeout

# o Laravel gera links https
./infra/nix/artisan.sh tinker --execute 'echo config("app.url");'
```

No navegador: cadeado fechado, e o login com Google concluindo até o
fim.

---

## Ordem recomendada

Fazendo nesta ordem, o site nunca fica fora do ar por mais que alguns
segundos:

1. Passo 1 e 2 (DNS + certificado) — site continua no ar pelo IP.
2. Passo 4 e 5 (certificado + nginx) — passa a responder nos dois.
3. Teste o domínio com calma.
4. Passo 3 (fechar o firewall) — só quando o domínio estiver ok.
5. Passo 6 (Google).
