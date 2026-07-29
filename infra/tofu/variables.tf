variable "hcloud_token" {
  description = "Hetzner Cloud API token (Project-scoped, Read & Write). Created in Hetzner Console > Project > Security > API Tokens. See infra/SETUP.md."
  type        = string
  sensitive   = true
}

variable "location" {
  description = "Hetzner location code for the VPS and Floating IP."
  type        = string
  default     = "fsn1" # Falkenstein, EU
}

variable "project_name" {
  description = "Logical name prefix for all resources (used in names and labels)."
  type        = string
  default     = "fisioweb"
}

variable "server_type_app" {
  description = "Hetzner server type for the single app VPS."
  type        = string
  default     = "cx23"
}

variable "image" {
  description = "Hetzner image slug for the VPS. Only used for the initial boot — install.sh immediately kexecs it into NixOS."
  type        = string
  default     = "debian-13"
}

variable "ssh_public_key" {
  description = "Public SSH key authorized on the VPS. Registered as an hcloud_ssh_key and attached at create time so root@<ip> works for the first install."
  type        = string
}

variable "admin_allowed_cidrs" {
  description = "CIDRs allowed inbound on SSH (port 22). Keep this to your laptop's public IP as a /32."
  type        = list(string)
  # No default — must be explicit so we never accidentally open SSH to 0.0.0.0/0.
}

variable "data_volume_size_gb" {
  description = "Hetzner Volume size (GB) mounted at /srv/data for Postgres + Valkey + Laravel storage."
  type        = number
  default     = 40
}

variable "backups_bucket_name" {
  description = <<-EOT
    R2 bucket for encrypted database backups (pg_dump | zstd | age).
    Lives in Cloudflare account 7c45003b…, the same account as the
    tofu state bucket, so it reuses credentials that already exist.

    NOT to be confused with the `fisioweb` app-uploads bucket, which
    lives in a different account (4925f2b7…) and is hand-managed
    outside this config.
  EOT
  type        = string
  default     = "fisioweb-backups"
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the tfstate + backups buckets. NOT the account holding the `fisioweb` app bucket (4925f2b7…)."
  type        = string
  default     = "7c45003b9de7c4655a880a0b02c0b2a0"
}
