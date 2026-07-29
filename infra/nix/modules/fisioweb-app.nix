# Top-level NixOS config for the fisioweb-app host.
#
# Runs the whole app: nginx + php-fpm + postgres + valkey + a queue
# worker + a scheduler + nightly encrypted backups to R2.
#
# Deliberately NOT here, in case you go looking for them:
#   - Grafana Alloy / Scaleway Cockpit telemetry
#   - Cloudflare Origin CA TLS      (no domain yet — see infra/DOMINIO.md)
#   - Scaleway Transactional Email  (no outbound mail configured yet)

{ modulesPath, pkgs, config, lib, fisiowebSource, ... }:
let
  # ⚠ DEV / STAGING ONLY — set to false before this host handles real
  # patient data.
  #
  # Ships composer's require-dev packages (fakerphp/faker, phpunit,
  # pint, sail, mockery, collision) in the deployed vendor tree.
  #
  # Needed because the demo seeders build records through model
  # factories, and factories call fake(). Laravel only defines that
  # helper when faker is present:
  #
  #   if (! function_exists('fake') && class_exists(\Faker\Factory::class))
  #
  # so with a --no-dev vendor tree every factory-based seeder dies with
  # "Call to undefined function ... fake()".
  #
  # The cost is a bigger closure plus test tooling on the server. The
  # real risk is forgetting this is on, which is what the warning below
  # exists to prevent — it fires on every build and every deploy.
  includeDevDeps = true;
in
let
  # PHP build shared by the composer install, the php-fpm pool, the
  # queue worker and the scheduler, so they can never drift on version
  # or extension set.
  #
  # Why each extension is here:
  #   redis            — CACHE_STORE/SESSION_DRIVER/QUEUE_CONNECTION=redis
  #   pgsql/pdo_pgsql  — DB_CONNECTION=pgsql
  #   intl             — Laravel + date formatting under pt_BR
  #   bcmath           — money math in the ClinicFinance module
  #   gd               — dompdf (Pdf module) + chillerlan/php-qrcode
  #   zip              — openspout (Xlsx module) + composer itself
  #   exif             — image orientation handling on Media uploads
  # `opentelemetry` is intentionally absent: fisioweb has no OTel
  # packages in composer.json, so the extension would be dead weight in
  # the closure.
  phpForApp = pkgs.php85.withExtensions ({ enabled, all }: enabled ++ (with all; [
    redis pgsql pdo_pgsql intl bcmath gd zip exif
  ]));

  # Exclude top-level vendor/node_modules/.git/storage only — nested
  # dirs with those names (e.g. resources/views/vendor/) are legitimate
  # source and must be kept. Filtering by basename anywhere in the tree
  # silently drops published package views and surfaces much later as a
  # "View [...] not found" at runtime.
  fisiowebSrc = lib.cleanSourceWith {
    name = "fisioweb-app-src";
    src = fisiowebSource;
    filter = path: type:
      let
        relPath  = lib.removePrefix (toString fisiowebSource + "/") (toString path);
        excluded = [ "vendor" "node_modules" ".git" "storage" ];
      in
      ! (builtins.any (e: relPath == e || lib.hasPrefix (e + "/") relPath) excluded);
  };

  # Composer vendor layer.
  #
  # composerNoScripts skips Laravel's post-install package:discover — it
  # needs a writable bootstrap/cache/, which only exists at boot, not at
  # build time. The cache is instead built lazily on first request and
  # wiped on every activation (see the activation script below).
  #
  # composerNoPlugins = false is LOAD-BEARING, do not "tidy" it away.
  #
  # fisioweb registers the `Modules\` PSR-4 namespace through
  # wikimedia/composer-merge-plugin (see extra.merge-plugin in
  # composer.json), which folds modules/*/composer.json into the root
  # install and injects `Modules\ => modules/` into the generated
  # autoloader.
  #
  # buildComposerProject defaults composerNoPlugins to TRUE. With that
  # default the plugin never runs, the autoloader has no Modules\ entry,
  # and every process dies at boot with:
  #
  #   Class "Modules\Admin\Providers\AdminServiceProvider" not found
  #
  # It fails at *runtime*, not build time — the vendor derivation builds
  # perfectly happily without it. Checking that vendor/nwidart/ exists
  # proves nothing; the thing to verify is that
  # vendor/composer/autoload_psr4.php contains a Modules\ key.
  #
  # vendorHash is pinned in infra/nix/composer-vendor.sha, refreshed by
  # infra/nix/refresh-hashes.sh whenever composer.lock changes the
  # resolved tree. Operators don't edit it by hand. Note that flipping
  # composerNoPlugins changes the hash too.
  fisiowebVendor = pkgs.php85.buildComposerProject {
    pname = "fisioweb-app-vendor";
    version = "0.0.0";
    src = fisiowebSrc;
    vendorHash = lib.fileContents ../composer-vendor.sha;

    composerNoPlugins = false;
    composerNoScripts = false;

    # See includeDevDeps at the top of this file.
    composerNoDev = !includeDevDeps;

    # Letting package:discover run is deliberate, and it is the reason
    # this build is worth trusting.
    #
    # It boots the framework and resolves every service provider — so if
    # the Modules\ namespace ever stops being autoloadable, the BUILD
    # fails here with the missing class, instead of every PHP process on
    # the VM fataling at boot after a successful deploy. That is exactly
    # the failure this project already hit once.
    #
    # It needs two directories the source tree doesn't provide:
    #   storage/framework/views — fisiowebSrc filters storage/ out
    #                             entirely, and the Blade compiler
    #                             refuses to construct without it
    #                             ("Please provide a valid cache path")
    #   bootstrap/cache         — where it writes packages.php
    #
    # Both are throwaway here: the runtime versions are symlinks to
    # /srv/data, and the fisiowebApp derivation deletes these before
    # wiring those up.
    postPatch = ''
      mkdir -p bootstrap/cache \
               storage/framework/views \
               storage/framework/cache \
               storage/framework/sessions \
               storage/logs
    '';
  };

  # Offline npm store, content-hashed. The build sandbox has no network,
  # so every package must be resolved here first.
  #
  # fisioweb uses npm (package-lock.json + pkgs.fetchNpmDeps). If the
  # project ever moves to pnpm or yarn, this block and npm-deps.sha are
  # what change.
  npmDeps = pkgs.fetchNpmDeps {
    name = "fisioweb-app-npm-deps";
    src = fisiowebSrc;
    hash = lib.fileContents ../npm-deps.sha;
  };

  # Vite build → public/build/ (manifest.json + hashed assets). Kept in
  # its own derivation so a frontend-only change doesn't bust the
  # composer layer, and vice versa.
  fisiowebAssets = pkgs.stdenv.mkDerivation {
    pname = "fisioweb-app-assets";
    version = "0.0.0";
    src = fisiowebSrc;

    # nodejs_22 matches package.json's `engines.node: >=22` and the
    # version the tests.yml workflow runs, so CI and prod build the
    # assets on the same major.
    nativeBuildInputs = [ pkgs.nodejs_22 pkgs.npmHooks.npmConfigHook ];
    inherit npmDeps;

    # Build-time frontend config.
    #
    # Vite inlines `import.meta.env.VITE_*` into the bundle at build
    # time, reading them from .env files *and* from process env vars
    # matching envPrefix. There is no .env in this sandbox (it's
    # gitignored, so it isn't in the source tree at all), so without
    # these the bundle ships `undefined` — the WhatsApp support link
    # would render as a dead `https://wa.me/undefined`.
    #
    # These are build-time and PUBLIC by definition: whatever goes here
    # is readable in the shipped JavaScript. Never put a secret in a
    # VITE_ variable — runtime secrets belong in secrets/app.env, which
    # only ever reaches PHP.
    VITE_APP_NAME = "Fisioweb";
    VITE_SUPPORT_WHATSAPP = "+5584994105215";

    buildPhase = ''
      runHook preBuild
      npm run build
      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      mkdir -p $out
      cp -r public/build $out/build
      runHook postInstall
    '';
  };

  # Final app layout: vendor + vite assets, with the writable paths
  # symlinked out to /srv/data (the Hetzner volume) so they survive a
  # server rebuild, and .env symlinked to the sops-rendered template.
  #
  # buildComposerProject uses the library layout, so the project root
  # lands under share/php/<pname>/.
  fisiowebApp = pkgs.runCommand "fisioweb-app" {} ''
    mkdir -p $out
    cp -r ${fisiowebVendor}/share/php/fisioweb-app-vendor/. $out/
    chmod -R +w $out
    rm -rf $out/public/build $out/storage $out/bootstrap/cache $out/public/storage $out/.env
    cp -r ${fisiowebAssets}/build $out/public/build
    ln -s /srv/data/fisioweb/storage         $out/storage
    ln -s /srv/data/fisioweb/bootstrap/cache $out/bootstrap/cache
    ln -s ../storage/app/public              $out/public/storage
    ln -s ${config.sops.templates.laravel-env.path} $out/.env
  '';

  # Per-operator login shell lookup. keys.nix carries a string name so
  # it stays free of `pkgs` and trivially readable; we resolve it to a
  # package here. Enabling each shell via programs.<shell>.enable below
  # wires up PAM, /etc/shells and the systemwide config.
  shellPackages = {
    bash = pkgs.bashInteractive;
    fish = pkgs.fish;
    zsh  = pkgs.zsh;
  };
in
{
  imports = [
    # Hetzner Cloud runs us in KVM; this profile pulls virtio_blk +
    # virtio_net + virtio_pci into initrd and enables the qemu guest
    # agent. Without it the kernel boots but can't see the disk or NIC.
    "${modulesPath}/profiles/qemu-guest.nix"

    # Both auto-generated by infra/nix/deploy.sh from tofu outputs, so
    # the volume device path and the floating IP can never drift from
    # what was actually provisioned.
    ./data-volume.nix
    ./floating-ip.nix
  ];

  system.stateVersion = "25.11";

  # Fires on every eval, so it shows up in every build and every deploy.
  # A temporary setting that stops announcing itself is how a dev-only
  # switch ends up in production.
  warnings = lib.optional includeDevDeps ''
    includeDevDeps = true — composer's require-dev packages (faker,
    phpunit, pint, sail, mockery, collision) are installed on this host.

    Intended only for a dev/staging box that needs to run the demo
    seeders. Set it to false in infra/nix/modules/fisioweb-app.nix
    before this host serves real patient data, then redeploy.
  '';

  # Disk layout comes from ./disko.nix (imported via flake.nix).
  # Hetzner Cloud VMs boot in legacy BIOS mode; disko's EF02 partition
  # tells grub where to install its stage 1.5.
  boot.loader.grub.enable = true;
  boot.loader.grub.efiSupport = false;

  networking = {
    hostName = "fisioweb-app";
    useDHCP = true;
    # The Hetzner cloud firewall is the real boundary (infra/tofu/firewall.tf);
    # this is defence in depth for anything that reaches the NIC.
    firewall.allowedTCPPorts = [ 22 80 443 ];
  };

  # UTC, matching config/app.php ('timezone' => 'UTC'). Using anything
  # else would put journald, systemd OnCalendar= and Laravel's own
  # timestamps on different clocks, making log correlation painful.
  time.timeZone = "UTC";

  services.openssh = {
    enable = true;
    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = false;
    };
  };

  # One wheel-enabled user per entry in keys.nix .operators, plus the
  # `fisioweb` system user that php-fpm runs as.
  #
  # They're composed into ONE assignment because Nix can't have both
  # `users.users = X` and `users.users.fisioweb = Y` in the same module
  # — they collide at parse time.
  users.users = lib.mapAttrs (_: op: {
    isNormalUser = true;
    extraGroups = [ "wheel" ];
    openssh.authorizedKeys.keys = [ op.pubkey ];
    shell = shellPackages.${op.shell or "bash"};
  } // lib.optionalAttrs (op.hashedPassword != null) {
    inherit (op) hashedPassword;
  }) (import ../../../keys.nix).operators // {
    fisioweb = { isSystemUser = true; group = "fisioweb"; };
  };

  users.groups.fisioweb = {};

  # Both shells enabled globally so any operator can pick either in
  # keys.nix without a second config change. Enabling here also adds
  # them to /etc/shells so chsh accepts them.
  programs.fish.enable = true;
  programs.zsh.enable  = true;

  # Default editor for systemctl edit, sudoedit, etc. defaultEditor
  # exports EDITOR/VISUAL system-wide.
  programs.neovim = {
    enable        = true;
    defaultEditor = true;
  };

  security.sudo.wheelNeedsPassword = false;

  nix.settings = {
    experimental-features = [ "nix-command" "flakes" ];
    # Lets operators push closures built on their own machine (or in CI)
    # to this host's nix-daemon via `nixos-rebuild --target-host`.
    # Without it the daemon rejects them with "lacks a signature by a
    # trusted key". Operators already have passwordless sudo, so this
    # doesn't widen the trust boundary — their SSH key is already
    # root-equivalent.
    trusted-users = [ "root" "@wheel" ];
    # Dedupe identical store files via hardlinks at build time.
    auto-optimise-store = true;
  };

  # Without GC, every nixos-rebuild pins its full closure forever. The
  # composer FOD alone is hundreds of MB and rebuilds whenever
  # composer.lock changes, so the root disk would fill within months of
  # active development. The most recent generation is always kept
  # regardless of age.
  nix.gc = {
    automatic = true;
    dates     = "weekly";
    options   = "--delete-older-than 30d";
  };

  nix.optimise = {
    automatic = true;
    dates     = [ "weekly" ];
  };

  # Ship terminfo for common terminals so `ssh fisioweb-app` from
  # ghostty/kitty/wezterm doesn't break less/vim.
  environment.enableAllTerminfo = true;

  # Handy on the box itself: psql/redis-cli for debugging, and the tools
  # the backup unit's restore path needs.
  environment.systemPackages = with pkgs; [ git jq zstd age awscli2 ];

  # Skip mandb's apropos/whatis index. `man <cmd>` still works; only the
  # precomputed search index is dropped. Generating it iterates every
  # man page in the closure, which adds minutes to every rebuild AND
  # hard-fails the whole switch if any single page is malformed.
  # programs.fish enables it by default; this overrides it back.
  documentation.man.cache.enable = false;

  # PGDATA lives on the Hetzner data volume so it survives a server
  # destroy/recreate. NixOS's postgresql-setup.service runs initdb on
  # first start (empty dataDir → fresh cluster). The major-version path
  # tracks `package`; on a major upgrade both bump together and the old
  # data dir stays alongside until you've validated the cutover.
  #
  # Auth is peer over the unix socket, no password: the `fisioweb`
  # system user maps to the `fisioweb` postgres role. That's why
  # secrets/app.env sets DB_HOST=/run/postgresql and has no DB_PASSWORD
  # — there is no password to leak.
  services.postgresql = {
    enable = true;
    package = pkgs.postgresql_18;
    dataDir = "/srv/data/postgresql/18";
    enableTCPIP = false;
    ensureDatabases = [ "fisioweb" ];
    ensureUsers = [{
      name = "fisioweb";
      ensureDBOwnership = true;
    }];
    authentication = ''
      local fisioweb fisioweb peer
    '';
  };

  # Cache + session + queue backend. Loopback only; Laravel connects
  # over TCP to 127.0.0.1.
  #
  # State (RDB/AOF) lives on /srv/data/redis so queued jobs survive a
  # server rebuild. Cache and session content is throwaway, but valkey
  # writes it all to the same dir — moving the whole working dir is
  # simpler than splitting it.
  #
  # nixpkgs has no dedicated services.valkey; valkey is wire-compatible
  # with redis so the redis module drives it. The unit is named
  # redis.service but it's running valkey.
  services.redis = {
    package = pkgs.valkey;
    servers."" = {
      enable = true;
      bind = "127.0.0.1";
      port = 6379;
      # mkForce because the redis module derives settings.dir from its
      # default StateDirectory; without the override this is a
      # conflicting-definition eval error.
      settings.dir = lib.mkForce "/srv/data/redis";
    };
  };

  # The redis unit has ProtectSystem=strict, so /srv/data/redis needs
  # explicit write access — StateDirectory only grants /var/lib/redis-*.
  systemd.services.redis.serviceConfig.ReadWritePaths = [ "/srv/data/redis" ];

  # Default catchall vhost on port 80.
  #
  # Plain HTTP, no TLS: fisioweb has no domain yet, so clients hit the
  # Floating IP directly and there is no certificate authority that will
  # issue for a bare IP. A Cloudflare Origin CA cert plus real_ip
  # handling for CF's edge ranges is what belongs here once a domain
  # lands; infra/DOMINIO.md has the exact diff.
  #
  # Because nothing proxies in front, $remote_addr is already the real
  # client address — no set_real_ip_from / CF-Connecting-IP handling is
  # needed, and adding it now would let a client spoof its own IP.
  services.nginx = {
    enable = true;
    recommendedGzipSettings = true;
    recommendedOptimisation = true;
    recommendedProxySettings = true;

    # Laravel accepts uploads (patient media, treatment program videos);
    # nginx's 1M default would reject them before PHP ever sees the
    # request. Keep this >= the app's own upload validation ceiling.
    clientMaxBodySize = "512m";

    virtualHosts."_" = {
      default = true;
      root = "${fisiowebApp}/public";
      # No `$uri/` term on purpose.
      #
      # With `$uri $uri/ /index.php…`, a request for `/` falls to the
      # `$uri/` term, which MATCHES because `/` is a directory. nginx
      # then looks for an index file, defaults to index.html, doesn't
      # find one, and returns 403 — never reaching the /index.php
      # fallback. (The upstream Laravel example gets away with `$uri/`
      # only because it also sets `index index.php`.)
      #
      # Laravel routes everything through index.php and has no directory
      # listings to serve, so dropping the term is both correct and one
      # less stat() per request.
      locations."/".tryFiles = "$uri /index.php?$query_string";
      locations."~ \\.php$".extraConfig = ''
        fastcgi_pass unix:${config.services.phpfpm.pools.fisioweb.socket};
        fastcgi_index index.php;
        include ${pkgs.nginx}/conf/fastcgi.conf;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;

        # PDF generation and XLSX export can outrun the 60s default on
        # large date ranges.
        fastcgi_read_timeout 300;
      '';
    };
  };

  # PHP-FPM pool. Runs as the dedicated `fisioweb` user; nginx reaches
  # it over the unix socket NixOS creates under /run/phpfpm.
  services.phpfpm.pools.fisioweb = {
    user = "fisioweb";
    group = "fisioweb";
    phpPackage = phpForApp;
    settings = {
      "listen.owner" = "nginx";
      "listen.group" = "nginx";
      pm = "dynamic";
      "pm.max_children" = 32;
      "pm.start_servers" = 2;
      "pm.min_spare_servers" = 2;
      "pm.max_spare_servers" = 4;
      # Forward PHP worker stderr through fpm to journald, so
      # LOG_CHANNEL=stderr in the Laravel .env actually surfaces in
      # `journalctl -u phpfpm-fisioweb`. Works because fpm's master
      # inherits StandardError=journal from the systemd unit.
      # decorate_workers_output=no strips fpm's "[pool fisioweb] child %d
      # said into stderr:" wrapper, leaving raw log lines.
      "catch_workers_output" = "yes";
      "decorate_workers_output" = "no";
    };
    phpOptions = ''
      upload_max_filesize = 512M
      post_max_size = 512M
      memory_limit = 512M
      max_execution_time = 300
    '';
  };

  # Laravel reads ${fisiowebApp}/.env, a symlink to the rendered
  # laravel-env template. The template concatenates the bulk env with
  # the narrow scoped credentials; each `placeholder.<name>` expands to
  # that secret's full decrypted plaintext at activation.
  #
  # sops-install-secrets decrypts every source file on every activation
  # using the age private key at /var/lib/sops-nix/key.txt, shipped by
  # install.sh via nixos-anywhere --extra-files on first install. It's a
  # copy of the operator's ~/.config/sops/age/keys.txt — same key both
  # sides, so every secrets/* file carries a single age1 recipient.
  sops = {
    defaultSopsFile = ../../../secrets/app.env;
    # Default stays "binary" for opaque blobs (r2-backup-creds). The
    # dotenv files opt in explicitly below. Don't flip this default —
    # binary files would then fail dotenv parsing at activation.
    defaultSopsFormat = "binary";
    age.keyFile = "/var/lib/sops-nix/key.txt";

    secrets.app-env = {
      format = "dotenv";
      owner  = "fisioweb";
      group  = "fisioweb";
      mode   = "0400";
    };

    # Cloudflare R2 credentials for Laravel's `r2` disk.
    #
    # One secret per sopsFile: sops-nix silently ignores the `key=`
    # extraction option for dotenv format (placeholders always expand to
    # the whole decrypted file). We rely on that — the placeholder
    # content already contains full `KEY=value` lines, so the template
    # below inlines it bare rather than as `SOMEKEY=${placeholder...}`.
    secrets.r2-app-creds = {
      sopsFile = ../../../secrets/r2-app-creds.env;
      format   = "dotenv";
      owner    = "fisioweb";
      group    = "fisioweb";
      mode     = "0400";
    };

    # APP_URL + GOOGLE_REDIRECT_URI, regenerated by deploy.sh from the
    # tofu floating-IP output on every deploy.
    secrets.app-url = {
      sopsFile = ../../../secrets/app-url.env;
      format   = "dotenv";
      owner    = "fisioweb";
      group    = "fisioweb";
      mode     = "0400";
    };

    # R2 credentials for the pg-backup unit. Consumed via systemd
    # EnvironmentFile=, so it's mounted whole (binary), not split
    # per-key. Owned by postgres because that's the unit's User=.
    secrets.r2-backup-creds = {
      sopsFile = ../../../secrets/r2-backup-creds;
      owner    = "postgres";
      group    = "postgres";
      mode     = "0400";
    };

    # Composite Laravel .env, rendered to
    # /run/secrets/rendered/laravel-env.
    #
    # Append order matters: dotenv parsing is last-wins, so app-url
    # comes last and overrides any stale APP_URL baked into app.env.
    # That's the whole mechanism that keeps the floating IP in exactly
    # one place — tofu state.
    templates.laravel-env = {
      content = ''
        ${config.sops.placeholder.app-env}
        ${config.sops.placeholder.r2-app-creds}
        ${config.sops.placeholder.app-url}
      '';
      owner = "fisioweb";
      group = "fisioweb";
      mode  = "0400";
    };
  };

  # Wipe Laravel's bootstrap caches on every activation.
  #
  # bootstrap/cache is symlinked to /srv/data so regenerated caches
  # survive a server rebuild — but that also means a previous deploy's
  # services.php / packages.php sticks around, listing service providers
  # and config bindings frozen in time. After a vendor change (a package
  # removed, a module disabled), the cached services.php references a
  # class that no longer exists and PHP fatals at boot for every process
  # — php-fpm pool, queue worker, scheduler. Clearing here forces a
  # rebuild on the next PHP invocation.
  system.activationScripts.fisioweb-bootstrap-cache-clear = {
    text = ''
      if [ -d /srv/data/fisioweb/bootstrap/cache ]; then
        rm -f /srv/data/fisioweb/bootstrap/cache/services.php
        rm -f /srv/data/fisioweb/bootstrap/cache/packages.php
        rm -f /srv/data/fisioweb/bootstrap/cache/config.php
        rm -f /srv/data/fisioweb/bootstrap/cache/routes-v7.php
      fi
    '';
    deps = [];
  };

  # Laravel queue worker. Reads QUEUE_CONNECTION and the redis/DB config
  # from ${fisiowebApp}/.env, so switching connections takes effect on
  # the next rebuild without touching this unit.
  #
  # --max-time=3600 recycles the worker hourly so leaked memory doesn't
  # accumulate; Restart=always brings it straight back, and also
  # survives a job that crashes the process outright.
  systemd.services.fisioweb-queue-worker = {
    description = "Laravel queue worker for fisioweb";
    after = [ "network-online.target" "postgresql.service" "redis.service" ];
    wants = [ "network-online.target" ];
    requires = [ "postgresql.service" "redis.service" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      Type = "simple";
      User = "fisioweb";
      Group = "fisioweb";
      WorkingDirectory = "${fisiowebApp}";
      ExecStart = "${phpForApp}/bin/php ${fisiowebApp}/artisan queue:work --tries=3 --max-time=3600";
      Restart = "always";
      RestartSec = "5s";
    };
  };

  # Laravel scheduler — the `* * * * * php artisan schedule:run` cron
  # line, as a systemd timer.
  #
  # fisioweb's .env carries GOOGLE_PULL_INTERVAL_MINUTES, which only
  # means anything if something runs on a schedule. The unit is
  # harmless until a task is registered in routes/console.php:
  # schedule:run with an empty schedule exits 0 immediately.
  systemd.services.fisioweb-scheduler = {
    description = "Laravel scheduler tick for fisioweb";
    after = [ "network-online.target" "postgresql.service" "redis.service" ];
    wants = [ "network-online.target" ];
    serviceConfig = {
      Type = "oneshot";
      User = "fisioweb";
      Group = "fisioweb";
      WorkingDirectory = "${fisiowebApp}";
      ExecStart = "${phpForApp}/bin/php ${fisiowebApp}/artisan schedule:run";
    };
  };

  systemd.timers.fisioweb-scheduler = {
    description = "Run the Laravel scheduler every minute";
    wantedBy = [ "timers.target" ];
    timerConfig = {
      OnCalendar = "minutely";
      # Not Persistent: a missed minute is just a missed tick, and
      # backfilling a burst of them after downtime is worse than
      # skipping. AccuracySec keeps systemd from batching the timer
      # into a coarse wakeup window.
      AccuracySec = "1s";
      Unit = "fisioweb-scheduler.service";
    };
  };

  # Nightly encrypted pg_dump to R2.
  #
  # The pipeline never lands plaintext on disk: pg_dump → zstd → age →
  # aws s3 cp, all streaming. The age recipient is the same operator
  # pubkey used for sops, so one key restores both /run/secrets/* and a
  # backup blob.
  #
  # Test manually:
  #   sudo systemctl start pg-backup.service
  #   sudo journalctl -u pg-backup.service -n 50
  #
  # Restore, from an operator laptop:
  #   aws s3 cp s3://fisioweb-backups/postgres/<ts>/fisioweb.sql.zst.age - \
  #     | age -d -i ~/.config/sops/age/keys.txt | zstd -d | psql fisioweb
  systemd.services.pg-backup = {
    description = "Encrypted pg_dump → R2 (fisioweb-backups bucket)";
    after = [ "postgresql.service" ];
    requires = [ "postgresql.service" ];
    path = with pkgs; [ config.services.postgresql.package zstd age awscli2 ];
    serviceConfig = {
      Type = "oneshot";
      User = "postgres";
      EnvironmentFile = "/run/secrets/r2-backup-creds";
    };
    script = ''
      set -euo pipefail
      ts=$(date -u +%Y-%m-%dT%H%M%SZ)
      pg_dump fisioweb \
        | zstd -19 \
        | age -r age1p7x52slpqnd0d9zy2p4x7ga73hzgp2737uc7j9zzkh9tun50zsqq20czfv \
        | aws s3 cp - "s3://fisioweb-backups/postgres/$ts/fisioweb.sql.zst.age"
    '';
  };

  systemd.timers.pg-backup = {
    description = "Nightly encrypted pg_dump → R2";
    wantedBy = [ "timers.target" ];
    timerConfig = {
      # 03:00 UTC (time.timeZone above). Persistent so a window missed
      # while the VM was down backfills on next boot — unlike the
      # scheduler, a skipped backup is worth catching up on.
      OnCalendar = "03:00";
      Persistent = true;
      Unit = "pg-backup.service";
    };
  };

  # Writable state, all under /srv/data so it survives a server destroy.
  # The surface is small by design: cache/sessions/queue live in valkey,
  # logs go to journald, and user uploads go to R2 — so only compiled
  # blade views, framework scratch, and the bootstrap cache need disk.
  #
  # 0755 on the app dirs because nginx (a different user) reads
  # public/storage/* directly.
  systemd.tmpfiles.rules = [
    "d /srv/data/fisioweb                          0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage                   0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/framework         0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/framework/views   0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/framework/cache   0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/framework/sessions 0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/logs              0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/app               0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/app/public        0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/storage/app/private       0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/bootstrap                 0755 fisioweb fisioweb - -"
    "d /srv/data/fisioweb/bootstrap/cache           0755 fisioweb fisioweb - -"
    "d /srv/data/redis                              0750 redis    redis    - -"
    # postgresql's unit gets ReadWritePaths=/srv/data/postgresql/18 from
    # the dataDir setting, and the namespace mount happens before
    # postgresql-pre-start — so the dir must already exist. Empty is
    # fine; initdb runs on first start. Bound to services.postgresql.package.
    "d /srv/data/postgresql                         0750 postgres postgres - -"
    "d /srv/data/postgresql/18                      0700 postgres postgres - -"
  ];
}
