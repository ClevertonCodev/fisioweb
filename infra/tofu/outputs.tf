output "app_floating_ipv4" {
  description = "Floating IPv4 attached to the app VPS. The address users hit, what APP_URL points at, and the deploy target. infra/nix/deploy.sh caches it into infra/nix/target-ip so the scripts don't have to decrypt state to find the host."
  value       = hcloud_floating_ip.app.ip_address
}

output "app_public_ipv4" {
  description = "Native public IPv4 of the app VPS. Not advertised; the kernel uses it as the source for outbound v4 traffic. Changes whenever the server is recreated."
  value       = hcloud_server.app.ipv4_address
}

output "app_public_ipv6" {
  description = "Native public IPv6 of the app VPS. Inbound is closed at the firewall; outbound is open."
  value       = hcloud_server.app.ipv6_address
}

output "data_volume_device" {
  description = "Stable device path of the attached data Volume. infra/nix/deploy.sh renders this into infra/nix/modules/data-volume.nix."
  value       = "/dev/disk/by-id/scsi-0HC_Volume_${hcloud_volume.data.id}"
}

output "backups_bucket" {
  description = "R2 bucket holding encrypted pg_dumps. Referenced by the pg-backup unit on the VM."
  value       = cloudflare_r2_bucket.backups.name
}
