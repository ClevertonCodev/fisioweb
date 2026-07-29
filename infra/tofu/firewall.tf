resource "hcloud_firewall" "app" {
  name = "${var.project_name}-app-fw"

  # Hetzner firewalls default-deny inbound, so anything not listed here
  # is dropped at Hetzner's network edge before it reaches the VM.

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = var.admin_allowed_cidrs
    description = "SSH from admin CIDRs"
  }

  # HTTP open to the world.
  #
  # Once a domain exists these should be scoped to Cloudflare's
  # published edge ranges, so only the CF proxy can reach the origin.
  # Today there is no domain — clients hit the Floating IP directly —
  # so that restriction would block all traffic. See infra/DOMINIO.md
  # for the swap to make when a domain lands.
  #
  # IPv6 is deliberately omitted: the only advertised address is the
  # floating IPv4. Leaving ::/0 off every rule closes the v6 stack to
  # inbound while keeping it available for outbound (R2, nixpkgs, …).
  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0"]
    description = "HTTP from anywhere (no CDN in front yet)"
  }

  # 443 is open even though nginx serves no TLS today. Without a
  # certificate the port simply refuses connections — the rule costs
  # nothing and means the domain cutover doesn't need a firewall change
  # applied in lockstep with the nginx change.
  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0"]
    description = "HTTPS from anywhere (reserved; nginx serves plain HTTP until a domain exists)"
  }

  rule {
    direction   = "in"
    protocol    = "icmp"
    source_ips  = ["0.0.0.0/0"]
    description = "ICMP for ping diagnostics"
  }

  labels = {
    project = var.project_name
    role    = "app"
  }
}

# NOTE: deploys run from an operator's laptop, never from CI. That is
# why port 22 is restricted to var.admin_allowed_cidrs and nothing else
# needs to reach it.
#
# An earlier revision carried a second, empty firewall that a GitHub
# Actions job opened and closed around each deploy. It's gone: with no
# CI deploy there is no runner to let in, and no Hetzner API token
# sitting in GitHub. If you ever revisit automated deploys, note that a
# static allowlist of GitHub's ranges is NOT expressible here —
# `https://api.github.com/meta` lists ~5,650 IPv4 CIDRs for Actions and
# a Hetzner firewall caps at 10 rules x 100 source IPs.
