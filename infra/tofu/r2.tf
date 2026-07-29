# R2 bucket for encrypted database backups.
#
# Lives in Cloudflare account 7c45003b… — the same account as the tofu
# state bucket — so it is covered by credentials that already exist. No
# new Cloudflare token was needed to stand fisioweb up.
#
# The `fisioweb` app-uploads bucket is deliberately absent from this
# config. It lives in a different Cloudflare account (4925f2b7…),
# predates this infra, and is hand-managed; Laravel reaches it with the
# credentials in secrets/r2-app-creds.env. Importing it here would mean
# minting a second Cloudflare token for that account for no real gain.
# If the two accounts are ever consolidated, add a cloudflare_r2_bucket
# resource plus an `import` block and move the credentials over.
#
# Written against the Cloudflare provider rather than aws_s3_bucket
# because R2 answers many of the AWS provider's bucket read-path calls
# with 501 NotImplemented (GetBucketAccelerate, GetBucketReplication,
# GetBucketLogging, …), and because only the R2-native resource
# understands `jurisdiction`.

resource "cloudflare_r2_bucket" "backups" {
  account_id   = var.cloudflare_account_id
  name         = var.backups_bucket_name
  jurisdiction = "eu"

  lifecycle {
    # Losing backups to a stray `tofu destroy` is exactly the failure
    # this bucket exists to prevent. Flip to false, apply, then destroy
    # if you ever genuinely need it gone.
    prevent_destroy = true
  }
}

# Consumed by the pg-backup systemd unit on the VM (see
# infra/nix/modules/fisioweb-app.nix). The unit writes to
# s3://<bucket>/postgres/<timestamp>/fisioweb.sql.zst.age using the
# credentials in secrets/r2-backup-creds — the same account-level R2 S3
# keys that drive this config's state backend.
#
# Restore, from an operator laptop:
#   aws s3 cp s3://fisioweb-backups/postgres/<ts>/fisioweb.sql.zst.age - \
#     | age -d -i ~/.config/sops/age/keys.txt \
#     | zstd -d \
#     | psql fisioweb
