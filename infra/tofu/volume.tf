# Persistent data volume for the app VPS. Holds the four pieces of state
# that must survive a `tofu destroy` of the server:
#   - /srv/data/postgresql/18        — postgres PGDATA
#   - /srv/data/redis                — valkey RDB + AOF (queued jobs)
#   - /srv/data/fisioweb/storage     — Laravel storage (compiled views, logs)
#   - /srv/data/fisioweb/bootstrap/* — package-discover cache
#
# User uploads are NOT here — they go to Cloudflare R2 via the `r2` disk
# (FILESYSTEM_DISK=r2), so this volume stays small and mostly database.
#
# Mounted on the VM at /srv/data via fileSystems."/srv/data" in the
# generated infra/nix/modules/data-volume.nix. The device path comes from
# `tofu output data_volume_device` after apply.
#
# delete_protection = true so `tofu destroy` on the volume itself errors
# instead of wiping the database during a teardown experiment. To
# actually delete: flip the flag to false, apply, then destroy.

resource "hcloud_volume" "data" {
  name              = "${var.project_name}-data"
  size              = var.data_volume_size_gb
  location          = var.location
  format            = "ext4"
  delete_protection = true

  labels = {
    project = var.project_name
    role    = "data"
  }
}
