# Declarative SSH key registry, imported by
# infra/nix/modules/fisioweb-app.nix for sshd authorized_keys and host
# identity.
#
# SSH keys ≠ sops keys. sops recipients live in .sops.yaml at the repo
# root and use an age1 key. This file governs who can *log in*, not who
# can decrypt secrets.

let
  # Production VM SSH host key. The private half lives on operators'
  # machines only; install.sh ships it via nixos-anywhere --extra-files
  # at install time, then NixOS picks it up from
  # /etc/ssh/ssh_host_ed25519_key on boot.
  #
  # Pinning the host key in git is what lets deploy.sh use
  # StrictHostKeyChecking=yes without a TOFU prompt, and means
  # reinstalling the VM doesn't trip "REMOTE HOST IDENTIFICATION HAS
  # CHANGED" on every operator's laptop.
  #
  # Generate once (see infra/SETUP.md):
  #   ssh-keygen -t ed25519 -f ~/Sync/profile/.ssh/fisioweb-app-host -N ''
  # then paste the .pub contents here. Regenerating means re-running
  # install.sh.
  #
  # The VM's sops decryption uses a *separate* age key — not this ssh
  # key — so rotating the host key doesn't touch secrets.
  fisiowebApp = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINpEvEubqOHDmk6t7z0INfQKpnBtVbs+KEs36qk/wF4Y fisioweb devops";
in
{
  inherit fisiowebApp;

  # Per-operator records. The attribute name is the username created on
  # the VM (fisioweb-app.nix loops over this, creating one wheel user
  # per entry). Your laptop's `whoami` should match an attr name so
  # deploy.sh and artisan.sh — which derive the SSH target from $USER —
  # Just Work. Set FISIOWEB_OPERATOR=<name> when they diverge.
  #
  # Fields:
  #   pubkey         — ed25519 SSH public key for sshd authorized_keys
  #   hashedPassword — yescrypt hash, for recovery via the Hetzner web
  #                    console when SSH is locked out (e.g. your ISP
  #                    changed your IP and the firewall shut you out).
  #                    Generate on any NixOS box with `mkpasswd -m yescrypt`.
  #                    `null` = key-only, no console recovery.
  #   shell          — "bash" | "fish" | "zsh". Resolved to a package in
  #                    fisioweb-app.nix so this file stays free of `pkgs`.
  #
  # Add an operator by dropping a record here and running deploy.sh.
  # No other change needed.
  operators = {
    eduardo = {
      pubkey         = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMv96hWzzTy6KFSn8CFmOSyDhCR6f4FBzMQ+9rL34vOi Eduardo Marinho <e@calmaamigo.com>";
      hashedPassword = "$y$j9T$GzI5imZ9nKwQMkw61spr51$/C1RLgmrZa49fE4RepNSYEi.zb6xmGvT5YZ3uvXvfU6";
      shell          = "fish";
    };
    # cleverton = {
    #   pubkey         = "ssh-ed25519 AAAA…";
    #   hashedPassword = null;   # or a `mkpasswd -m yescrypt` hash
    #   shell          = "bash";
    # };
  };
}
