# Operator SSH key registered in the Hetzner project.
#
# Created here rather than looked up with a data source: the fisioweb
# Hetzner project is new and empty, so there is no pre-existing key to
# reference. One less manual step in the console, and `tofu destroy`
# cleans it up.
#
# This key only matters for the FIRST boot: install.sh connects as
# root@<ip> to kexec the machine into the NixOS installer. Afterwards,
# authorized_keys is owned by NixOS (keys.nix .operators) and this
# resource is inert. Rotating it does not lock you out of an installed
# host.

resource "hcloud_ssh_key" "admin" {
  name       = "${var.project_name}-admin"
  public_key = var.ssh_public_key

  labels = {
    project = var.project_name
  }
}
