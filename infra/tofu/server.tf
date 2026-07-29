resource "hcloud_server" "app" {
  name        = "${var.project_name}-app-${var.location}"
  image       = var.image
  server_type = var.server_type_app
  location    = var.location

  ssh_keys     = [hcloud_ssh_key.admin.id]
  firewall_ids = [hcloud_firewall.app.id]

  # Native IPv4 + IPv6 both on. The native IPv4 isn't the advertised
  # address — the Floating IP is — but it gives the kernel a working v4
  # source for outbound traffic (R2, nixpkgs, GitHub) at negligible cost.
  # Inbound exposure is controlled at the firewall layer.
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  # The image above is only what the machine boots once. install.sh runs
  # nixos-anywhere, which kexecs into a NixOS installer and repartitions
  # the disk per infra/nix/modules/disko.nix. Changing `image` after the
  # install therefore does nothing until you rebuild the server from
  # scratch — and would wipe it if you did.
  lifecycle {
    ignore_changes = [image]
  }

  labels = {
    project = var.project_name
    role    = "app"
  }
}

resource "hcloud_volume_attachment" "data" {
  volume_id = hcloud_volume.data.id
  server_id = hcloud_server.app.id
  automount = false
}
