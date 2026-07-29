# Non-secret tofu variables for the fisioweb project. Committed to git.
# Secrets (hcloud_token, provider creds, state passphrase) come from
# sops via direnv — see .envrc.

# Your laptop's public IP as a /32 CIDR. This is the ONLY source allowed
# to SSH into the VM, so if your ISP hands you a new address you'll lock
# yourself out until you update this and re-apply. Recover via the
# Hetzner web console.
#
# Check your current value with: curl ifconfig.me
admin_allowed_cidrs = [
  "170.80.157.239/32",
]

# Operator SSH public key, registered in the Hetzner project and
# authorized on the VM's first boot. Cat it out with:
#   cat ~/.ssh/id_ed25519.pub
ssh_public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMv96hWzzTy6KFSn8CFmOSyDhCR6f4FBzMQ+9rL34vOi Eduardo Marinho <e@calmaamigo.com>"

# R2 bucket for encrypted pg_dumps, in Cloudflare account 7c45003b….
# The `fisioweb` app-uploads bucket lives in a different account and is
# not managed here — see r2.tf.
backups_bucket_name = "fisioweb-backups"

# Optional overrides — the defaults in variables.tf are what we run.
# location            = "fsn1"
# server_type_app     = "cx23"
# data_volume_size_gb = 40
