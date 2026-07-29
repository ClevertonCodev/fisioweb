# Client-side state + plan encryption (OpenTofu 1.7+).
#
# The R2 backend stores state objects, but without this block the blob
# is plaintext. With encryption configured here, OpenTofu encrypts the
# state with a PBKDF2-derived AES-GCM key before every write to the
# backend, and decrypts it on every read. R2 never sees plaintext state.
#
# This matters more than usual here: the state holds the Hetzner API
# token and every resource attribute.
#
# The passphrase lives in secrets/operator/tfstate-passphrase (sops
# binary, operator-only — never shipped to the VM). direnv decrypts it
# on `cd` into this dir and exports it as TF_VAR_state_passphrase.
# See .envrc.
#
# Losing the passphrase = losing access to state. Both the sops file and
# the age key that decrypts it must be preserved.

variable "state_passphrase" {
  type        = string
  description = "Passphrase for tfstate encryption. Sourced from sops via direnv (TF_VAR_state_passphrase); never set in tfvars."
  sensitive   = true
}

terraform {
  encryption {
    key_provider "pbkdf2" "state" {
      passphrase = var.state_passphrase
    }
    method "aes_gcm" "state" {
      keys = key_provider.pbkdf2.state
    }

    state {
      method   = method.aes_gcm.state
      enforced = true
    }
    plan {
      method = method.aes_gcm.state
    }
  }
}
