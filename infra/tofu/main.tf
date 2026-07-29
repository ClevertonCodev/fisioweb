terraform {
  required_version = ">= 1.10.0"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.48"
    }
    cloudflare = {
      # Manages the R2 backups bucket. We use the Cloudflare provider
      # rather than the AWS provider's aws_s3_bucket because:
      #   1. R2 answers a dozen of the AWS provider's read-path calls
      #      (GetBucketAccelerate, GetBucketReplication, GetBucketLogging,
      #      …) with 501 NotImplemented, which makes plans flaky.
      #   2. Only the R2-native resource understands `jurisdiction`.
      # Reads CLOUDFLARE_API_TOKEN from the environment (see .envrc).
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # State lives in Cloudflare R2 (S3-compatible), in a Cloudflare
  # account we already operate — reusing its existing R2 credentials, so
  # fisioweb needs no new Cloudflare token.
  #
  # The state bucket (fisioweb-tfstate) is created by hand in the
  # Cloudflare dashboard before the first `tofu init`: chicken-and-egg,
  # since tofu can't manage the bucket holding its own state. See
  # infra/SETUP.md.
  #
  # NOTE: this is a different Cloudflare account from the one holding the
  # `fisioweb` app-uploads bucket (4925f2b7…). That bucket stays
  # hand-managed and is deliberately NOT in this config — its credentials
  # live in secrets/r2-app-creds.env and are consumed only by Laravel.
  #
  # Credentials come from env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY),
  # decrypted from credentials.env by direnv. The bucket name and endpoint
  # below are not secret, so they stay in git.
  backend "s3" {
    bucket = "fisioweb-tfstate"
    key    = "terraform.tfstate"
    region = "auto" # R2 uses "auto" as the region.

    endpoints = {
      # EU jurisdiction subdomain — the state bucket must be created in
      # the EU jurisdiction for this hostname to resolve to it. Drop the
      # ".eu." segment if you ever move it out of the EU.
      s3 = "https://7c45003b9de7c4655a880a0b02c0b2a0.eu.r2.cloudflarestorage.com"
    }

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true

    use_path_style = true

    # R2 supports S3 conditional writes (If-None-Match: *), so native S3
    # locking works. Leave this on even though we're single-operator — it
    # costs nothing and guards against accidental concurrent applies (e.g.
    # a second laptop, a forgotten background run).
    use_lockfile = true
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

# Reads CLOUDFLARE_API_TOKEN from the environment (set in
# infra/tofu/credentials.env, loaded by direnv). A pre-existing token
# for account 7c45003b… — it already carries "Workers R2 Storage:
# Edit", which is all the backups bucket needs.
provider "cloudflare" {}
