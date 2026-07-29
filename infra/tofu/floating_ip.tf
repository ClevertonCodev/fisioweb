# Floating IPv4 — the stable public address for the app.
#
# The whole point is that it outlives the server: you can destroy and
# recreate hcloud_server.app (new native IP each time) and the address
# users hit never moves. Production DNS, APP_URL, and the deploy target
# all reference this, not the server's native IP.
#
# Created here rather than looked up, because this project has no
# pre-existing address — which means it is unknown until the first
# `tofu apply`. Everything downstream that needs the value (APP_URL,
# floating-ip.nix, infra/nix/target-ip, the deploy target) is generated
# from `tofu output -raw app_floating_ipv4` by infra/nix/deploy.sh. The
# address is therefore never typed by hand anywhere: this resource is
# the single source of truth.
#
# delete_protection = true so a `tofu destroy` experiment can't drop the
# address and hand it to another Hetzner customer. To actually release
# it: flip the flag to false, apply, then destroy.

resource "hcloud_floating_ip" "app" {
  name              = "${var.project_name}-app"
  type              = "ipv4"
  home_location     = var.location
  description       = "Stable public IPv4 for the fisioweb app host"
  delete_protection = true

  labels = {
    project = var.project_name
    role    = "app"
  }
}

# Binding the address to the server at the Hetzner routing layer is only
# half the job — the VM's kernel also has to claim it on the NIC. That
# side lives in infra/nix/modules/floating-ip.nix, which deploy.sh
# generates from this resource's address.
resource "hcloud_floating_ip_assignment" "app" {
  floating_ip_id = hcloud_floating_ip.app.id
  server_id      = hcloud_server.app.id
}
